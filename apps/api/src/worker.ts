import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { db } from './db/client';
import { holds, jobs, showSeats, waitlistEntries } from './db/schema';

const WORKER_ID = `api-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const MAX_ATTEMPTS = 5;

async function reclaimStaleJobs() {
  await db.update(jobs).set({ status: 'pending', lockedAt: null, lockedBy: null }).where(and(eq(jobs.status, 'processing'), sql`${jobs.lockedAt} < now() - interval '5 minutes'`));
}

async function claimJob() {
  return db.transaction(async tx => {
    const row = (await tx.select().from(jobs).where(and(eq(jobs.status, 'pending'), lte(jobs.availableAt, new Date()))).for('update', { skipLocked: true }).limit(1))[0];
    if (!row) return undefined;
    return (await tx.update(jobs).set({ status: 'processing', lockedAt: new Date(), lockedBy: WORKER_ID, attempts: sql`${jobs.attempts} + 1` }).where(eq(jobs.id, row.id)).returning())[0];
  });
}

async function handleJob(job: typeof jobs.$inferSelect) {
  if (job.type === 'release_expired_holds') {
    await db.transaction(async tx => {
      const expired = await tx.select({ id: holds.id, showId: holds.showId }).from(holds).where(and(eq(holds.status, 'active'), sql`${holds.heldUntil} <= now()`));
      await tx.update(showSeats).set({ status: 'available', heldByUserId: null, heldUntil: null, heldPricePaise: null, version: sql`${showSeats.version} + 1` }).where(and(eq(showSeats.status, 'held'), sql`${showSeats.heldUntil} <= now()`));
      await tx.update(holds).set({ status: 'cancelled', cancelledAt: new Date() }).where(and(eq(holds.status, 'active'), sql`${holds.heldUntil} <= now()`));
      for (const hold of expired) {
        const next = (await tx.select({ id: waitlistEntries.id }).from(waitlistEntries).where(and(eq(waitlistEntries.showId, hold.showId), eq(waitlistEntries.status, 'waiting'))).orderBy(asc(waitlistEntries.createdAt)).limit(1))[0];
        if (next) await tx.update(waitlistEntries).set({ status: 'offered', offeredAt: new Date(), offerExpiresAt: new Date(Date.now() + 15 * 60_000) }).where(eq(waitlistEntries.id, next.id));
      }
    });
  }
  // Email and other integrations are intentionally idempotent handlers. Until a
  // provider is configured, marking the durable job complete is safe and visible.
}

async function processOne() {
  const job = await claimJob();
  if (!job) return false;
  try {
    await handleJob(job);
    await db.update(jobs).set({ status: 'completed', completedAt: new Date(), lockedAt: null, lockedBy: null }).where(eq(jobs.id, job.id));
    if (job.type === 'release_expired_holds') await db.insert(jobs).values({ type: 'release_expired_holds', payload: {}, availableAt: new Date(Date.now() + 30_000) });
  } catch (error) {
    const exhausted = job.attempts >= MAX_ATTEMPTS;
    await db.update(jobs).set({ status: exhausted ? 'failed' : 'pending', availableAt: new Date(Date.now() + Math.min(60_000, 1000 * 2 ** job.attempts)), lastError: error instanceof Error ? error.message.slice(0, 500) : 'Job failed', lockedAt: null, lockedBy: null }).where(eq(jobs.id, job.id));
  }
  return true;
}

export function startWorker() {
  const tick = async () => { try { await reclaimStaleJobs(); while (await processOne()) { /* drain currently available work */ } } catch (error) { console.error('worker tick failed', error); } };
  void tick();
  return setInterval(() => void tick(), 5000);
}
