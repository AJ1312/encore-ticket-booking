CREATE TABLE "holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"show_id" uuid NOT NULL,
	"seat_ids" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"held_until" timestamp with time zone NOT NULL,
	"converted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" uuid;--> statement-breakpoint
UPDATE "refresh_tokens" SET "family_id" = gen_random_uuid() WHERE "family_id" IS NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "replaced_by_id" uuid;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "offered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "offer_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "holds_show_status_idx" ON "holds" USING btree ("show_id","status");--> statement-breakpoint
CREATE INDEX "holds_user_idx" ON "holds" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "waitlist_show_status_idx" ON "waitlist_entries" USING btree ("show_id","status");--> statement-breakpoint
CREATE INDEX "waitlist_user_show_idx" ON "waitlist_entries" USING btree ("user_id","show_id");
