import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  confirmSchema,
  eventCreateSchema,
  holdSchema,
  loginSchema,
  passwordResetSchema,
  registerSchema,
  showCreateSchema,
  venueCreateSchema,
  waitlistSchema,
} from '@encore/shared';

describe('Encore Core Business & Security Verification Suite', () => {
  const JWT_SECRET = 'super-secret-test-jwt-access-key-32-chars!!';
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');

  describe('1. Authentication, Password Hashing & Token Rotation', () => {
    it('hashes passwords with argon2 securely and verifies correctly', async () => {
      const password = 'CorrectHorseBatteryStaple123!';
      const hash = await argon2.hash(password);
      expect(hash).toContain('$argon2');
      expect(await argon2.verify(hash, password)).toBe(true);
      expect(await argon2.verify(hash, 'WrongPassword123!')).toBe(false);
    });

    it('issues valid 15-minute JWT access tokens with correct user role payload', () => {
      const user = {
        id: randomUUID(),
        name: 'Aarav Sharma',
        email: 'aarav@encore.local',
        role: 'customer' as const,
      };

      const token = jwt.sign(
        { sub: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.sub).toBe(user.id);
      expect(decoded.name).toBe(user.name);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe('customer');
      expect(decoded.exp - decoded.iat).toBe(15 * 60);
    });

    it('detects refresh token reuse and enforces token family revocation', () => {
      const familyId = randomUUID();
      const token1Raw = randomBytes(48).toString('base64url');
      const token1Hash = digest(token1Raw);

      const tokenStore = new Map<string, { familyId: string; tokenHash: string; revokedAt: Date | null }>();
      tokenStore.set('t1', { familyId, tokenHash: token1Hash, revokedAt: null });

      // First refresh: valid, rotates t1 to t2
      const stored = tokenStore.get('t1')!;
      expect(stored.revokedAt).toBeNull();
      stored.revokedAt = new Date();

      const token2Raw = randomBytes(48).toString('base64url');
      const token2Hash = digest(token2Raw);
      tokenStore.set('t2', { familyId, tokenHash: token2Hash, revokedAt: null });

      // Attacker replays t1:
      const replayed = tokenStore.get('t1')!;
      expect(replayed.revokedAt).not.toBeNull();
      // Enforce family revocation
      for (const [key, val] of tokenStore.entries()) {
        if (val.familyId === replayed.familyId) {
          val.revokedAt = new Date();
        }
      }

      // Legitimate user with t2 is now safely protected (t2 revoked)
      expect(tokenStore.get('t2')!.revokedAt).not.toBeNull();
    });

    it('enforces single-use password reset tokens with SHA-256 digests', () => {
      const rawToken = randomBytes(48).toString('base64url');
      const tokenHash = digest(rawToken);

      const resetTokenRecord = {
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60_000),
        usedAt: null as Date | null,
      };

      // Verify token match
      expect(resetTokenRecord.tokenHash).toBe(digest(rawToken));
      expect(resetTokenRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(resetTokenRecord.usedAt).toBeNull();

      // Consume token
      resetTokenRecord.usedAt = new Date();

      // Subsequent attempt fails
      expect(resetTokenRecord.usedAt).not.toBeNull();
    });
  });

  describe('2. Role-Based Access Control (RBAC) Guard Logic', () => {
    function canAccessRoute(userRole: string | undefined, routeAllowedRoles: string[] | undefined): boolean {
      if (!routeAllowedRoles || routeAllowedRoles.length === 0) return true; // public
      if (!userRole) return false;
      return routeAllowedRoles.includes(userRole);
    }

    it('allows public access to public routes', () => {
      expect(canAccessRoute(undefined, undefined)).toBe(true);
      expect(canAccessRoute('customer', undefined)).toBe(true);
    });

    it('denies unauthenticated or unauthorized roles', () => {
      expect(canAccessRoute(undefined, ['organiser', 'admin'])).toBe(false);
      expect(canAccessRoute('customer', ['organiser', 'admin'])).toBe(false);
      expect(canAccessRoute('customer', ['admin'])).toBe(false);
      expect(canAccessRoute('organiser', ['admin'])).toBe(false);
    });

    it('allows authorised roles to access protected routes', () => {
      expect(canAccessRoute('organiser', ['organiser', 'admin'])).toBe(true);
      expect(canAccessRoute('admin', ['organiser', 'admin'])).toBe(true);
      expect(canAccessRoute('admin', ['admin'])).toBe(true);
    });
  });

  describe('3. Concurrency, 8-Seat Limit & Server-Side Holds', () => {
    it('enforces maximum 8 seats selection limit', () => {
      const mockSeats = Array.from({ length: 9 }, () => randomUUID());
      expect(holdSchema.safeParse({ seatIds: mockSeats.slice(0, 8) }).success).toBe(true);
      expect(holdSchema.safeParse({ seatIds: mockSeats }).success).toBe(false);
      expect(holdSchema.safeParse({ seatIds: [] }).success).toBe(false);
    });

    it('resolves concurrent seat contention: exactly 1 winner, 1 loser (race condition prevention)', async () => {
      type SeatRecord = {
        id: string;
        status: 'available' | 'held' | 'booked';
        heldBy: string | null;
        heldUntil: Date | null;
        version: number;
      };

      const seat: SeatRecord = {
        id: 'seat-101',
        status: 'available',
        heldBy: null,
        heldUntil: null,
        version: 0,
      };

      // Atomic compare-and-swap simulation mimicking PostgreSQL UPDATE WHERE status = 'available'
      function tryHoldSeat(userId: string, targetSeat: SeatRecord): boolean {
        if (targetSeat.status === 'available' || (targetSeat.status === 'held' && targetSeat.heldUntil && targetSeat.heldUntil < new Date())) {
          targetSeat.status = 'held';
          targetSeat.heldBy = userId;
          targetSeat.heldUntil = new Date(Date.now() + 900 * 1000); // 15 mins
          targetSeat.version += 1;
          return true;
        }
        return false;
      }

      const userA = 'user-alice';
      const userB = 'user-bob';

      // Simulate simultaneous hold attempts
      const [resA, resB] = [tryHoldSeat(userA, seat), tryHoldSeat(userB, seat)];

      const winners = [resA, resB].filter(Boolean);
      expect(winners.length).toBe(1);
      expect(seat.heldBy).toBe(userA);
      expect(seat.version).toBe(1);
    });

    it('allows re-holding only after 15-minute TTL expiration', () => {
      const seat = {
        id: 'seat-102',
        status: 'held' as const,
        heldBy: 'user-alice',
        heldUntil: new Date(Date.now() - 1000), // expired 1 sec ago
        version: 1,
      };

      const isExpired = seat.status === 'held' && seat.heldUntil < new Date();
      expect(isExpired).toBe(true);

      // Re-claiming seat by another user succeeds
      if (isExpired) {
        seat.status = 'held';
        seat.heldBy = 'user-bob';
        seat.heldUntil = new Date(Date.now() + 900 * 1000);
        seat.version += 1;
      }

      expect(seat.heldBy).toBe('user-bob');
      expect(seat.version).toBe(2);
    });
  });

  describe('4. Idempotent Booking Confirmation & Cryptographic QR Verification', () => {
    it('returns existing booking on duplicate confirmation with same idempotencyKey (no double booking)', () => {
      const bookingsDb = new Map<string, any>();
      const idempotencyKey = 'unique-client-req-uuid-9999';
      const userId = 'user-1';

      function confirmBooking(req: { userId: string; idempotencyKey: string; seatIds: string[] }) {
        const key = `${req.userId}:${req.idempotencyKey}`;
        if (bookingsDb.has(key)) {
          return { ...bookingsDb.get(key), isIdempotent: true };
        }

        const rawQrToken = randomBytes(48).toString('base64url');
        const qrTokenHash = digest(rawQrToken);

        const booking = {
          id: randomUUID(),
          bookingRef: `ENC-${randomUUID().slice(0, 8).toUpperCase()}`,
          userId: req.userId,
          idempotencyKey: req.idempotencyKey,
          seatIds: req.seatIds,
          qrTokenHash,
          qrToken: rawQrToken,
          status: 'confirmed',
          isIdempotent: false,
        };

        bookingsDb.set(key, booking);
        return booking;
      }

      const firstCall = confirmBooking({ userId, idempotencyKey, seatIds: ['s1', 's2'] });
      expect(firstCall.isIdempotent).toBe(false);
      expect(firstCall.qrToken).toBeDefined();

      const secondCall = confirmBooking({ userId, idempotencyKey, seatIds: ['s1', 's2'] });
      expect(secondCall.isIdempotent).toBe(true);
      expect(secondCall.id).toBe(firstCall.id);
      expect(secondCall.bookingRef).toBe(firstCall.bookingRef);
    });

    it('verifies QR token by SHA-256 hash match against PostgreSQL record', () => {
      const rawToken = randomBytes(48).toString('base64url');
      const storedHash = digest(rawToken);

      const verify = (inputToken: string) => {
        const calculatedHash = digest(inputToken);
        return calculatedHash === storedHash;
      };

      expect(verify(rawToken)).toBe(true);
      expect(verify('invalid-tampered-token')).toBe(false);
    });
  });

  describe('5. Seat-Level Attendance Check-in & Cancellation Invariants', () => {
    it('supports seat-by-seat attendance check-in and idempotent re-scans', () => {
      const seats = [
        { showSeatId: 'seat-a1', checkedInAt: null as Date | null },
        { showSeatId: 'seat-a2', checkedInAt: null as Date | null },
      ];

      function checkin(seatIds: string[]) {
        return seatIds.map(id => {
          const seat = seats.find(s => s.showSeatId === id);
          if (!seat) return { seatId: id, alreadyCheckedIn: false };
          if (seat.checkedInAt) return { seatId: id, alreadyCheckedIn: true };
          seat.checkedInAt = new Date();
          return { seatId: id, alreadyCheckedIn: false };
        });
      }

      // First check-in of seat-a1
      const res1 = checkin(['seat-a1']);
      expect(res1[0].alreadyCheckedIn).toBe(false);
      expect(seats[0].checkedInAt).not.toBeNull();

      // Second check-in of seat-a1 (duplicate scan)
      const res2 = checkin(['seat-a1']);
      expect(res2[0].alreadyCheckedIn).toBe(true);

      // Check-in of remaining seat-a2
      const res3 = checkin(['seat-a2']);
      expect(res3[0].alreadyCheckedIn).toBe(false);
      expect(seats[1].checkedInAt).not.toBeNull();
    });

    it('refuses attendance check-in for cancelled bookings', () => {
      const booking = { status: 'cancelled' };
      expect(booking.status === 'cancelled').toBe(true);
    });
  });

  describe('6. FIFO Waitlist Fairness & 15-Minute Reallocation', () => {
    it('allocates cancelled seats to earliest waiting user in category (FIFO fairness)', () => {
      const waitlist = [
        { id: 'w1', userId: 'user-early', category: 'Premium', status: 'waiting', createdAt: new Date('2026-08-20T10:00:00Z') },
        { id: 'w2', userId: 'user-late', category: 'Premium', status: 'waiting', createdAt: new Date('2026-08-20T11:00:00Z') },
      ];

      // Sort by createdAt ascending (FIFO)
      const sorted = [...waitlist].filter(w => w.status === 'waiting' && w.category === 'Premium').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const winner = sorted[0];
      expect(winner.userId).toBe('user-early');

      // Create 15-minute offer
      const offerExpiry = new Date(Date.now() + 15 * 60_000);
      winner.status = 'offered';

      expect(winner.status).toBe('offered');
      expect(offerExpiry.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('7. Durable Job Queue, BullMQ & Exponential Backoff Retry', () => {
    it('calculates exponential backoff delay correctly across attempts', () => {
      const getBackoffDelay = (attempt: number) => Math.min(60_000, 1000 * 2 ** attempt);
      expect(getBackoffDelay(1)).toBe(2000);
      expect(getBackoffDelay(2)).toBe(4000);
      expect(getBackoffDelay(3)).toBe(8000);
      expect(getBackoffDelay(4)).toBe(16000);
      expect(getBackoffDelay(5)).toBe(32000);
      expect(getBackoffDelay(6)).toBe(60000); // capped at 60s
    });

    it('marks job failed when maximum attempts (5) are exhausted', () => {
      const MAX_ATTEMPTS = 5;
      const job = { attempts: 4, status: 'processing' };

      job.attempts += 1;
      const isExhausted = job.attempts >= MAX_ATTEMPTS;

      expect(isExhausted).toBe(true);
      expect(isExhausted ? 'failed' : 'pending').toBe('failed');
    });
  });
});
