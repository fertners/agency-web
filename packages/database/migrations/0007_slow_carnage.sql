CREATE TYPE "public"."communication_channel" AS ENUM('EMAIL', 'PHONE_NOTE', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('DRAFT', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'CONTACT_READY' BEFORE 'DISMISSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'CONTACTED' BEFORE 'DISMISSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'RESPONDED' BEFORE 'DISMISSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'CONVERTED' BEFORE 'DISMISSED';--> statement-breakpoint
CREATE TABLE "communication_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"status" "draft_status" DEFAULT 'DRAFT' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"status" "conversation_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "proposal_status" DEFAULT 'NEEDS_REVIEW' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"scope" jsonb NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"timeline_days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"from_status" varchar(40),
	"to_status" varchar(40) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communication_drafts" ADD CONSTRAINT "communication_drafts_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_notes" ADD CONSTRAINT "prospect_notes_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_status_history" ADD CONSTRAINT "prospect_status_history_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communication_drafts_conversation_idx" ON "communication_drafts" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_prospect_unique" ON "conversations" USING btree ("prospect_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_prospect_version_unique" ON "proposals" USING btree ("prospect_id","version");--> statement-breakpoint
CREATE INDEX "proposals_status_updated_idx" ON "proposals" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "prospect_notes_prospect_idx" ON "prospect_notes" USING btree ("prospect_id","created_at");--> statement-breakpoint
CREATE INDEX "prospect_status_history_prospect_idx" ON "prospect_status_history" USING btree ("prospect_id","created_at");