import { and, asc, eq, lte, gt, sql } from 'drizzle-orm';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from './db/client';
import { holds, jobs, payments, seats, showSeats, waitlistEntries, shows, events, bookings, users } from './db/schema';

const WORKER_ID = `api-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const MAX_ATTEMPTS = 5;

async function reclaimStaleJobs() {
  await db.update(jobs)
    .set({ status: 'pending', lockedAt: null, lockedBy: null })
    .where(and(eq(jobs.status, 'processing'), sql`${jobs.lockedAt} < now() - interval '5 minutes'`));
}

async function claimJob() {
  return db.transaction(async tx => {
    const row = (await tx.select().from(jobs)
      .where(and(eq(jobs.status, 'pending'), lte(jobs.availableAt, new Date())))
      .for('update', { skipLocked: true })
      .limit(1))[0];
    if (!row) return undefined;
    return (await tx.update(jobs)
      .set({ status: 'processing', lockedAt: new Date(), lockedBy: WORKER_ID, attempts: sql`${jobs.attempts} + 1` })
      .where(eq(jobs.id, row.id))
      .returning())[0];
  });
}

export async function handleJob(job: typeof jobs.$inferSelect) {
  if (job.type === 'release_expired_holds') {
    await db.transaction(async tx => {
      // 1. Release expired holds
      const expired = await tx.select({ id: holds.id, showId: holds.showId, seatIds: holds.seatIds })
        .from(holds)
        .where(and(eq(holds.status, 'active'), sql`${holds.heldUntil} <= now()`));

      await tx.update(showSeats)
        .set({ status: 'available', heldByUserId: null, heldUntil: null, heldPricePaise: null, version: sql`${showSeats.version} + 1` })
        .where(and(eq(showSeats.status, 'held'), sql`${showSeats.heldUntil} <= now()`));

      await tx.update(holds)
        .set({ status: 'cancelled', cancelledAt: new Date() })
        .where(and(eq(holds.status, 'active'), sql`${holds.heldUntil} <= now()`));

      // 2. Mark expired waitlist offers
      await tx.update(waitlistEntries)
        .set({ status: 'expired' })
        .where(and(eq(waitlistEntries.status, 'offered'), sql`${waitlistEntries.offerExpiresAt} <= now()`));

      // 3. Re-allocate newly available seats to the waitlist FIFO queue
      for (const hold of expired) {
        await allocateWaitlist(tx, hold.showId, Array.isArray(hold.seatIds) ? (hold.seatIds as string[]) : []);
      }
    });
  }

  if (job.type === 'allocate_waitlist') {
    const payload = job.payload as { showId?: string; seatIds?: string[] };
    if (payload.showId && payload.seatIds?.length) {
      await db.transaction(tx => allocateWaitlist(tx, payload.showId!, payload.seatIds!));
    }
  }

  if (job.type === 'payment_timeout') {
    const payload = job.payload as { paymentId?: string };
    if (payload.paymentId) {
      await db.transaction(async tx => {
        const row = (await tx.select().from(payments)
          .where(and(eq(payments.id, payload.paymentId!), eq(payments.status, 'pending'), sql`${payments.expiresAt} <= now()`))
          .limit(1))[0];
        if (row) {
          await tx.update(payments).set({ status: 'timed_out', timedOutAt: new Date() }).where(eq(payments.id, row.id));
          const seatIds = Array.isArray(row.seatIds) ? (row.seatIds as string[]) : [];
          if (seatIds.length) {
            await tx.update(showSeats)
              .set({ status: 'available', heldByUserId: null, heldUntil: null, heldPricePaise: null, version: sql`${showSeats.version} + 1` })
              .where(and(eq(showSeats.heldByUserId, row.userId), eq(showSeats.status, 'held')));
            await tx.update(holds)
              .set({ status: 'cancelled', cancelledAt: new Date() })
              .where(and(eq(holds.id, row.holdId), eq(holds.status, 'active')));
            await allocateWaitlist(tx, row.showId, seatIds);
          }
        }
      });
    }
  }

  if (job.type === 'email_notification' || job.type === 'booking_confirmation') {
    let payload = job.payload as any;
    
    // For booking_confirmation, we only get { bookingId }, so we must fetch the details
    if (job.type === 'booking_confirmation' && payload.bookingId) {
      const details = (await db.select({
        email: users.email,
        bookingRef: bookings.bookingRef,
        eventTitle: events.title
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.userId))
      .innerJoin(shows, eq(shows.id, bookings.showId))
      .innerJoin(events, eq(events.id, shows.eventId))
      .where(eq(bookings.id, payload.bookingId))
      .limit(1))[0];
      
      if (details) {
        payload = {
          to: details.email,
          subject: `Encore Pass Ready — ${details.bookingRef}`,
          bookingRef: details.bookingRef,
          eventTitle: details.eventTitle,
          template: 'booking_confirmed'
        };
      }
    }

    const to = payload.to || 'customer@encore.local';
    const subject = payload.subject || `Encore Pass Ready — ${payload.bookingRef || 'Booking Confirmed'}`;
    
    const baseStyle = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0c0e10; color: #f3eee7; margin: 0; padding: 40px 20px; line-height: 1.6; } .container { max-width: 600px; margin: 0 auto; background-color: #171a1c; border: 1px solid #37312e; border-radius: 8px; overflow: hidden; } .header { padding: 40px 40px 20px; text-align: center; } .header h1 { margin: 16px 0 0; font-size: 32px; color: #f3eee7; font-weight: normal; font-family: Georgia, serif; } .header em { color: #ff6b35; font-style: italic; } .icon-wrapper { display: flex; justify-content: center; align-items: center; margin-bottom: 16px; } .content { padding: 20px 40px 40px; text-align: center; } .content p { font-size: 16px; color: #a49d97; margin-bottom: 24px; } .event-title { display: inline-block; background-color: #2a2522; color: #ff6b35; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 18px; margin: 8px 0 24px; border: 1px solid #4a3a31; } .button { display: inline-block; padding: 14px 32px; background-color: #ff6b35; color: #190c07; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; transition: opacity 0.2s; } .footer { padding: 20px 40px; background-color: #0c0e10; text-align: center; font-size: 12px; color: #a49d97; border-top: 1px dashed #37312e; }`;

    const wrap = (header: string, content: string, iconSvg: string) => `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon-wrapper">${iconSvg}</div>
            ${header}
          </div>
          <div class="content">${content}</div>
          <div class="footer">Encore Tickets, Inc. &middot; Your cryptographic pass to the evening</div>
        </div>
      </body>
      </html>
    `;

    const icons = {
      check: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      cancel: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      bell: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffb703" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`
    };

    let html = payload.html;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!html) {
      if (payload.template === 'booking_cancelled') {
        html = wrap(`<h1>Booking <em>Cancelled</em></h1>`, `
          <p>We've successfully cancelled your booking for:</p>
          <div class="event-title">${payload.eventTitle || 'the event'}</div>
          <p>Your seats have been released back to the waitlist pool. (Ref: ${payload.bookingRef})</p>
        `, icons.cancel);
      } else if (payload.template === 'waitlist_offer') {
        html = wrap(`<h1>Seat <em>Available</em></h1>`, `
          <p>Good news! Seats have opened up for:</p>
          <div class="event-title">${payload.eventTitle || 'the event'}</div>
          <p>We've reserved these seats for you for the next 15 minutes. Claim them before the timer runs out!</p>
          <a href="${baseUrl}/shows/${payload.showId}/checkout" class="button">Claim Seats</a>
        `, icons.bell);
      } else if (payload.template === 'event_reminder') {
        html = wrap(`<h1>It's <em>Time</em></h1>`, `
          <p>Your event is happening today!</p>
          <div class="event-title">${payload.eventTitle || 'the event'}</div>
          <p>Don't forget to have your QR pass ready. We hope you have a spectacular evening.</p>
          <a href="${baseUrl}/booking/${payload.bookingRef}/confirmation" class="button">View QR Pass</a>
        `, icons.bell);
      } else {
        html = wrap(`<h1>Pass <em>Ready</em></h1>`, `
          <p>Your ticket pass is confirmed for:</p>
          <div class="event-title">${payload.eventTitle || 'your event'}</div>
          <p>Your seats are securely locked. Have your QR pass ready at the gate. (Ref: ${payload.bookingRef})</p>
          <a href="${baseUrl}/booking/${payload.bookingRef}/confirmation" class="button">View QR Pass</a>
        `, icons.check);
      }
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Encore Concierge <tickets@encore.local>',
            to,
            subject,
            html,
          }),
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Resend API Error: ${res.status} - ${text}`);
        }
      } catch (err) {
        console.error('Failed to send email via Resend API:', err);
        throw err; // throw to fail the job so we can see it in jobs table
      }
    } else {
      console.log(`[MailDispatcher] Dispatched ${job.type} to ${to} (Subject: "${subject}")`);
    }
  }

  if (job.type === 'dispatch_event_reminders') {
    await db.transaction(async tx => {
      const upper = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const lower = new Date(Date.now() + 23 * 60 * 60 * 1000);
      
      const upcomingShows = await tx.select({ id: shows.id, title: events.title })
        .from(shows)
        .innerJoin(events, eq(events.id, shows.eventId))
        .where(and(gt(shows.startsAt, lower), lte(shows.startsAt, upper)));
        
      for (const show of upcomingShows) {
        const confirmedBookings = await tx.select({ bookingRef: bookings.bookingRef, email: users.email })
          .from(bookings)
          .innerJoin(users, eq(users.id, bookings.userId))
          .where(and(eq(bookings.showId, show.id), eq(bookings.status, 'confirmed')));
          
        for (const b of confirmedBookings) {
          await tx.insert(jobs).values({
            type: 'email_notification',
            payload: {
              to: b.email,
              subject: `It's almost time — ${show.title}`,
              bookingRef: b.bookingRef,
              eventTitle: show.title,
              template: 'event_reminder'
            }
          });
        }
      }
    });
  }
}

export async function allocateWaitlist(tx: any, showId: string, seatIds: string[]) {
  const categories = new Set<string>();
  for (const showSeatId of seatIds) {
    const seat = (await tx.select({ category: seats.category })
      .from(showSeats)
      .innerJoin(seats, eq(seats.id, showSeats.seatId))
      .where(and(eq(showSeats.id, showSeatId), eq(showSeats.showId, showId), eq(showSeats.status, 'available')))
      .limit(1))[0];
    if (seat) categories.add(seat.category);
  }

  if (categories.size === 0) return;

  const eventDetails = (await tx.select({ title: events.title }).from(shows).innerJoin(events, eq(events.id, shows.eventId)).where(eq(shows.id, showId)).limit(1))[0];

  for (const category of categories) {
    const waitingUsers = await tx.select({ id: waitlistEntries.id, userId: waitlistEntries.userId, email: users.email })
      .from(waitlistEntries)
      .innerJoin(users, eq(users.id, waitlistEntries.userId))
      .where(and(eq(waitlistEntries.showId, showId), eq(waitlistEntries.category, category), eq(waitlistEntries.status, 'waiting')))
      .for('update', { skipLocked: true });

    for (const waitlistUser of waitingUsers) {
      await tx.update(waitlistEntries)
        .set({ status: 'offered', offeredAt: new Date(), offerExpiresAt: null })
        .where(eq(waitlistEntries.id, waitlistUser.id));

      if (eventDetails) {
        await tx.insert(jobs).values({
          type: 'email_notification',
          payload: {
            to: waitlistUser.email,
            subject: `Encore Waitlist — Seats Available!`,
            eventTitle: eventDetails.title,
            showId: showId,
            template: 'waitlist_offer'
          }
        });
      }
    }
  }
}

export async function processOne() {
  const job = await claimJob();
  if (!job) return false;
  try {
    await handleJob(job);
    await db.update(jobs)
      .set({ status: 'completed', completedAt: new Date(), lockedAt: null, lockedBy: null })
      .where(eq(jobs.id, job.id));
    if (job.type === 'release_expired_holds') {
      await db.insert(jobs).values({ type: 'release_expired_holds', payload: {}, availableAt: new Date(Date.now() + 30_000) });
    }
    if (job.type === 'dispatch_event_reminders') {
      await db.insert(jobs).values({ type: 'dispatch_event_reminders', payload: {}, availableAt: new Date(Date.now() + 3600_000) });
    }
  } catch (error) {
    const exhausted = job.attempts >= MAX_ATTEMPTS;
    await db.update(jobs)
      .set({
        status: exhausted ? 'failed' : 'pending',
        availableAt: new Date(Date.now() + Math.min(60_000, 1000 * 2 ** job.attempts)),
        lastError: error instanceof Error ? error.message.slice(0, 500) : 'Job failed',
        lockedAt: null,
        lockedBy: null,
      })
      .where(eq(jobs.id, job.id));
  }
  return true;
}

export function startWorker() {
  // Only boot BullMQ if explicitly enabled, so we don't drain free-tier Redis limits
  if (process.env.USE_BULLMQ === 'true' && process.env.REDIS_URL) return startBullMqWorker();
  const tick = async () => {
    try {
      await reclaimStaleJobs();
      while (await processOne()) {
        /* drain available work */
      }
    } catch (error) {
      console.error('worker tick failed', error);
    }
  };
  void tick();
  return setInterval(() => void tick(), 5000);
}

function startBullMqWorker() {
  const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  const queue = new Queue('encore-jobs', { connection });
  const worker = new Worker('encore-jobs', async bullJob => {
    const row = (await db.select().from(jobs).where(eq(jobs.id, String(bullJob.data.dbJobId))).limit(1))[0];
    if (!row || row.status === 'completed') return;
    await db.update(jobs).set({ status: 'processing', lockedAt: new Date(), lockedBy: `bullmq-${bullJob.id}` }).where(eq(jobs.id, row.id));
    try {
      await handleJob(row);
      await db.update(jobs).set({ status: 'completed', completedAt: new Date(), lockedAt: null, lockedBy: null }).where(eq(jobs.id, row.id));
      if (row.type === 'release_expired_holds') {
        await db.insert(jobs).values({ type: 'release_expired_holds', payload: {}, availableAt: new Date(Date.now() + 30_000) });
      }
      if (row.type === 'dispatch_event_reminders') {
        await db.insert(jobs).values({ type: 'dispatch_event_reminders', payload: {}, availableAt: new Date(Date.now() + 3600_000) });
      }
    } catch (error) {
      const exhausted = bullJob.attemptsMade + 1 >= 5;
      await db.update(jobs).set({
        status: exhausted ? 'failed' : 'pending',
        lastError: error instanceof Error ? error.message.slice(0, 500) : 'Job failed',
        lockedAt: null,
        lockedBy: null,
      }).where(eq(jobs.id, row.id));
      throw error;
    }
  }, { connection, concurrency: Number(process.env.WORKER_CONCURRENCY || 4) });

  worker.on('error', error => console.error('BullMQ worker error', error));

  const enqueue = async () => {
    const pending = await db.select().from(jobs)
      .where(and(eq(jobs.status, 'pending'), lte(jobs.availableAt, new Date())))
      .limit(50);
    for (const job of pending) {
      await queue.add(job.type, { dbJobId: job.id }, {
        jobId: job.id,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
    }
  };
  void enqueue();
  return setInterval(() => void enqueue().catch(error => console.error('BullMQ enqueue failed', error)), 5000);
}
