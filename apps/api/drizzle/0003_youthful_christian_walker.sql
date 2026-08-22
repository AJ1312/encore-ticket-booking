ALTER TABLE "booking_seats" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "qr_token_hash" text;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "offered_seat_ids" jsonb;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_qr_token_hash_unique" UNIQUE("qr_token_hash");