CREATE TYPE "public"."proposal_response" AS ENUM('ACCEPTED', 'DECLINED');--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "message" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "analysis_issues" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "preview_url" text DEFAULT 'http://127.0.0.1:3002' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "public_token" varchar(64);--> statement-breakpoint
UPDATE "proposals" SET "public_token" = replace(gen_random_uuid()::text, '-', '') WHERE "public_token" IS NULL;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "public_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "response" "proposal_response";--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_public_token_unique" ON "proposals" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "proposals_expiry_idx" ON "proposals" USING btree ("expires_at", "response");--> statement-breakpoint
CREATE TABLE "contact_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_hash" varchar(64) NOT NULL,
	"reason" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retain_until" timestamp with time zone NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "contact_suppressions_identity_unique" ON "contact_suppressions" USING btree ("identity_hash");
