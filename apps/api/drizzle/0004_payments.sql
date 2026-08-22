CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "show_id" uuid NOT NULL REFERENCES "shows"("id"),
  "hold_id" uuid NOT NULL REFERENCES "holds"("id"),
  "seat_ids" jsonb NOT NULL,
  "amount_paise" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "paid_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "timed_out_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "payments_show_idx" ON "payments" ("show_id");
