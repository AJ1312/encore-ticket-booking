import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from './db/client';
import { holds, jobs, payments, seats, showSeats, waitlistEntries } from './db/schema';

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
    const payload = job.payload as { to?: string; subject?: string; bookingRef?: string; eventTitle?: string; html?: string };
    const to = payload.to || 'customer@encore.local';
    const subject = payload.subject || `Encore Pass Ready — ${payload.bookingRef || 'Booking Confirmed'}`;
    
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Encore Concierge <tickets@encore.local>',
            to,
            subject,
            html: payload.html || `<p>Your ticket pass for <strong>${payload.eventTitle || 'your event'}</strong> (${payload.bookingRef || 'Pass'}) is confirmed! Present your QR pass at the gate.</p>`,
          }),
        });
      } catch (err) {
        console.error('Failed to send email via Resend API:', err);
      }
    } else {
      console.log(`[MailDispatcher] Dispatched ${job.type} to ${to} (Subject: "${subject}")`);
    }
  }
}

export async function allocateWaitlist(tx: any, showId: string, seatIds: string[]) {
  for (const showSeatId of seatIds) {
    const seat = (await tx.select({ category: seats.category })
      .from(showSeats)
      .innerJoin(seats, eq(seats.id, showSeats.seatId))
      .where(and(eq(showSeats.id, showSeatId), eq(showSeats.showId, showId), eq(showSeats.status, 'available')))
      .limit(1))[0];
    if (!seat) continue;

    const next = (await tx.select({ id: waitlistEntries.id, userId: waitlistEntries.userId })
      .from(waitlistEntries)
      .where(and(eq(waitlistEntries.showId, showId), eq(waitlistEntries.category, seat.category), eq(waitlistEntries.status, 'waiting')))
      .orderBy(asc(waitlistEntries.createdAt))
      .for('update', { skipLocked: true })
      .limit(1))[0];
    if (!next) continue;

    const until = new Date(Date.now() + 15 * 60_000);
    const updated = await tx.update(showSeats)
      .set({ status: 'held', heldByUserId: next.userId, heldUntil: until, version: sql`${showSeats.version} + 1` })
      .where(and(eq(showSeats.id, showSeatId), eq(showSeats.status, 'available')))
      .returning({ id: showSeats.id });
    if (!updated[0]) continue;

    await tx.insert(holds).values({ userId: next.userId, showId, seatIds: [showSeatId], heldUntil: until });
    await tx.update(waitlistEntries)
      .set({ status: 'offered', offeredSeatIds: [showSeatId], offeredAt: new Date(), offerExpiresAt: until })
      .where(eq(waitlistEntries.id, next.id));
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
  if (process.env.REDIS_URL) return startBullMqWorker();
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
