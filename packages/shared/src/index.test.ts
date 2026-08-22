import { describe, expect, it } from 'vitest';
import { confirmSchema, holdSchema, passwordResetSchema, registerSchema } from './index';

describe('shared request contracts', () => {
  it('rejects invalid or oversized hold requests', () => {
    expect(holdSchema.safeParse({ seatIds: [] }).success).toBe(false);
    expect(holdSchema.safeParse({ seatIds: Array.from({ length: 9 }, () => crypto.randomUUID()) }).success).toBe(false);
  });

  it('requires idempotency for confirmation', () => {
    expect(confirmSchema.safeParse({ seatIds: [crypto.randomUUID()] }).success).toBe(false);
  });

  it('enforces password length and reset token shape', () => {
    expect(registerSchema.safeParse({ name: 'A', email: 'a@example.com', password: 'short' }).success).toBe(false);
    expect(passwordResetSchema.safeParse({ token: 'short', password: 'password123' }).success).toBe(false);
  });
});
