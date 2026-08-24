import { db } from './db/client';
import { jobs, waitlistEntries, shows, events, venues, seats, showSeats, holds, bookings, users } from './db/schema';
import { eq } from 'drizzle-orm';
import { allocateWaitlist } from './worker';

async function test() {
  console.log('Testing waitlist...');
  const user = await db.select().from(users).limit(1);
  if (!user.length) return console.log('No user');
  
  const show = await db.select().from(shows).limit(1);
  if (!show.length) return console.log('No show');

  console.log('User:', user[0].email, 'Show:', show[0].id);

  // Get an available seat
  const seat = await db.select({ id: showSeats.id, category: seats.category }).from(showSeats).innerJoin(seats, eq(seats.id, showSeats.seatId)).where(eq(showSeats.status, 'available')).limit(1);
  if (!seat.length) return console.log('No available seats');

  console.log('Seat:', seat[0]);

  // Join waitlist
  const entry = await db.insert(waitlistEntries).values({ showId: show[0].id, category: seat[0].category, userId: user[0].id, status: 'waiting' }).returning();
  console.log('Waitlist entry created:', entry[0].id);

  // Trigger allocateWaitlist
  await db.transaction(async tx => {
    await allocateWaitlist(tx, show[0].id, [seat[0].id]);
  });

  // Check if job was inserted
  const queued = await db.select().from(jobs).orderBy(jobs.id);
  console.log('Queued jobs:', queued[queued.length - 1]);

  // Clean up
  await db.delete(waitlistEntries).where(eq(waitlistEntries.id, entry[0].id));
  await db.delete(jobs).where(eq(jobs.id, queued[queued.length - 1].id));
  process.exit(0);
}
test().catch(console.error);
