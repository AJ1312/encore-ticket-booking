import { z } from 'zod';

export const roleSchema = z.enum(['customer', 'organiser', 'admin']);
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const registerSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8), role: z.enum(['customer', 'organiser']).optional().default('customer') });
export const holdSchema = z.object({ seatIds: z.array(z.string().uuid()).min(1).max(8) });
export const confirmSchema = z.object({ seatIds: z.array(z.string().uuid()).min(1).max(8), holdId: z.string().uuid().optional().nullable().or(z.literal('')), idempotencyKey: z.string().min(16).max(128), guestEmail: z.string().email().optional() });
export const waitlistSchema = z.object({ showId: z.string().uuid(), category: z.string().min(1).max(40), email: z.string().email().optional() });
export const passwordResetRequestSchema = z.object({ email: z.string().email() });
export const passwordResetSchema = z.object({ token: z.string().min(32).max(200), password: z.string().min(8).max(200) });
export const eventCreateSchema = z.object({ title: z.string().trim().min(2).max(160), description: z.string().trim().min(2).max(5000), type: z.enum(['movie', 'concert', 'comedy', 'dining', 'other']), posterUrl: z.string().url().max(1000) });
export const showCreateSchema = z.object({ eventId: z.string().uuid(), venueId: z.string().uuid(), startsAt: z.coerce.date() });
export const seatCreateSchema = z.object({ section: z.string().min(1), rowLabel: z.string().min(1), seatNumber: z.number().int().min(1), category: z.string().min(1), pricePaise: z.number().int().min(0) });
export const venueCreateSchema = z.object({ name: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(100), address: z.string().trim().min(2).max(255), timezone: z.string().trim().min(2).max(50).default('Asia/Kolkata') });
export const seatAvailabilitySchema = z.object({ status: z.enum(['available', 'blocked']) });

export type Role = 'customer' | 'organiser' | 'admin';
export type Session = { id: string; name: string; email: string; role: Role; permissions?: string[] };
