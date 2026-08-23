import { describe, expect, it } from 'vitest';
import {
  confirmSchema,
  eventCreateSchema,
  holdSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
  roleSchema,
  seatAvailabilitySchema,
  showCreateSchema,
  venueCreateSchema,
  waitlistSchema,
} from './index';

describe('shared request contracts and schemas', () => {
  describe('auth schemas', () => {
    it('validates registration schema requirements', () => {
      expect(registerSchema.safeParse({ name: 'Aarav', email: 'aarav@example.com', password: 'password123' }).success).toBe(true);
      expect(registerSchema.safeParse({ name: 'A', email: 'aarav@example.com', password: 'password123' }).success).toBe(false);
      expect(registerSchema.safeParse({ name: 'Aarav', email: 'invalid-email', password: 'password123' }).success).toBe(false);
      expect(registerSchema.safeParse({ name: 'Aarav', email: 'aarav@example.com', password: 'short' }).success).toBe(false);
    });

    it('validates login schema requirements', () => {
      expect(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'invalid', password: 'password123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'user@example.com', password: '123' }).success).toBe(false);
    });

    it('validates password reset request and reset schemas', () => {
      expect(passwordResetRequestSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
      expect(passwordResetRequestSchema.safeParse({ email: 'bad-email' }).success).toBe(false);

      const validToken = 'a'.repeat(32);
      expect(passwordResetSchema.safeParse({ token: validToken, password: 'newPassword123!' }).success).toBe(true);
      expect(passwordResetSchema.safeParse({ token: 'short', password: 'newPassword123!' }).success).toBe(false);
      expect(passwordResetSchema.safeParse({ token: validToken, password: 'short' }).success).toBe(false);
    });

    it('validates roles', () => {
      expect(roleSchema.safeParse('customer').success).toBe(true);
      expect(roleSchema.safeParse('organiser').success).toBe(true);
      expect(roleSchema.safeParse('admin').success).toBe(true);
      expect(roleSchema.safeParse('superadmin').success).toBe(false);
    });
  });

  describe('booking & hold schemas', () => {
    it('enforces 1 to 8 seat bounds on hold requests', () => {
      const validUuid = '11111111-1111-4111-8111-111111111111';
      expect(holdSchema.safeParse({ seatIds: [validUuid] }).success).toBe(true);
      expect(holdSchema.safeParse({ seatIds: Array.from({ length: 8 }, () => validUuid) }).success).toBe(true);
      expect(holdSchema.safeParse({ seatIds: [] }).success).toBe(false);
      expect(holdSchema.safeParse({ seatIds: Array.from({ length: 9 }, () => validUuid) }).success).toBe(false);
      expect(holdSchema.safeParse({ seatIds: ['not-a-uuid'] }).success).toBe(false);
    });

    it('enforces confirmation schema idempotency key requirements', () => {
      const validUuid = '11111111-1111-4111-8111-111111111111';
      const validIdemKey = 'idem-key-1234567890123456';
      expect(confirmSchema.safeParse({ seatIds: [validUuid], idempotencyKey: validIdemKey }).success).toBe(true);
      expect(confirmSchema.safeParse({ seatIds: [validUuid], idempotencyKey: 'short' }).success).toBe(false);
      expect(confirmSchema.safeParse({ seatIds: [], idempotencyKey: validIdemKey }).success).toBe(false);
    });

    it('validates waitlist schema', () => {
      const validUuid = '11111111-1111-4111-8111-111111111111';
      expect(waitlistSchema.safeParse({ showId: validUuid, category: 'Premium' }).success).toBe(true);
      expect(waitlistSchema.safeParse({ showId: 'not-uuid', category: 'Premium' }).success).toBe(false);
      expect(waitlistSchema.safeParse({ showId: validUuid, category: '' }).success).toBe(false);
    });
  });

  describe('management & resource schemas', () => {
    it('validates event creation schema', () => {
      expect(
        eventCreateSchema.safeParse({
          title: 'Acoustic Evenings',
          description: 'A quiet and warm music performance.',
          type: 'concert',
          posterUrl: 'https://example.com/poster.jpg',
        }).success
      ).toBe(true);

      expect(
        eventCreateSchema.safeParse({
          title: 'A',
          description: 'Too short',
          type: 'unknown',
          posterUrl: 'not-a-url',
        }).success
      ).toBe(false);
    });

    it('validates show creation schema', () => {
      const validEventId = '11111111-1111-4111-8111-111111111111';
      const validVenueId = '22222222-2222-4222-8222-222222222222';
      expect(
        showCreateSchema.safeParse({
          eventId: validEventId,
          venueId: validVenueId,
          startsAt: '2026-08-28T20:00:00.000Z',
        }).success
      ).toBe(true);
    });

    it('validates venue creation schema', () => {
      expect(
        venueCreateSchema.safeParse({
          name: 'The Royal Theatre',
          city: 'Mumbai',
          address: 'Colaba Causeway',
          timezone: 'Asia/Kolkata',
        }).success
      ).toBe(true);

      expect(
        venueCreateSchema.safeParse({
          name: '',
          city: 'Mumbai',
          address: 'Colaba',
        }).success
      ).toBe(false);
    });

    it('validates seat availability patch schema', () => {
      expect(seatAvailabilitySchema.safeParse({ status: 'available' }).success).toBe(true);
      expect(seatAvailabilitySchema.safeParse({ status: 'blocked' }).success).toBe(true);
      expect(seatAvailabilitySchema.safeParse({ status: 'held' }).success).toBe(false);
    });
  });
});
