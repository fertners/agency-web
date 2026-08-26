CREATE TYPE "public"."client_request_status" AS ENUM('NEW', 'ANALYZING', 'PLANNED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."conversation_intent" AS ENUM('QUESTION', 'PRICE', 'DESIGN_REQUEST', 'SEO_REQUEST', 'INTERESTED', 'NOT_INTERESTED', 'SUPPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."job_log_level" AS ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('INBOUND', 'OUTBOUND', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');--> statement-breakpoint
ALTER TYPE "public"."agent_job_status" ADD VALUE 'CANCELLED' BEFORE 'NEEDS_REVIEW';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'ONBOARDING' BEFORE 'ACTIVE';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'PAUSED' BEFORE 'INACTIVE';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'CANCELLED' BEFORE 'INACTIVE';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'COMPLETED' BEFORE 'INACTIVE';--> statement-breakpoint
ALTER TYPE "public"."conversation_status" ADD VALUE 'UNREAD' BEFORE 'OPEN';--> statement-breakpoint
ALTER TYPE "public"."conversation_status" ADD VALUE 'WAITING' BEFORE 'CLOSED';--> statement-breakpoint
ALTER TYPE "public"."conversation_status" ADD VALUE 'REPLIED' BEFORE 'CLOSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'DISCOVERED' BEFORE 'QUALIFIED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'ANALYZING' BEFORE 'QUALIFIED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'PREVIEW_GENERATED' BEFORE 'CONTACT_READY';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'REVIEW_REQUIRED' BEFORE 'CONTACT_READY';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'REPLIED' BEFORE 'CONVERTED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'INTERESTED' BEFORE 'CONVERTED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'PROPOSAL_SENT' BEFORE 'CONVERTED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'WON' BEFORE 'DISMISSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'LOST' BEFORE 'DISMISSED';--> statement-breakpoint
ALTER TYPE "public"."prospect_status" ADD VALUE 'ARCHIVED';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'BUILDING' BEFORE 'READY';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'REVIEW' BEFORE 'READY';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'NEEDS_CHANGES' BEFORE 'READY';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'APPROVED' BEFORE 'ARCHIVED';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'DEPLOYING' BEFORE 'ARCHIVED';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'LIVE' BEFORE 'ARCHIVED';--> statement-breakpoint
ALTER TYPE "public"."website_status" ADD VALUE 'FAILED' BEFORE 'ARCHIVED';--> statement-breakpoint
CREATE TABLE "agent_job_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"level" "job_log_level" NOT NULL,
	"agent" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"section" varchar(50) NOT NULL,
	"value" jsonb NOT NULL,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"website_id" uuid,
	"source_version_id" uuid,
	"result_version_id" uuid,
	"status" "client_request_status" DEFAULT 'NEW' NOT NULL,
	"request" text NOT NULL,
	"analysis" jsonb,
	"modification_plan" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"provider" varchar(80) NOT NULL,
	"external_reference" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"version" integer NOT NULL,
	"status" "template_status" DEFAULT 'DRAFT' NOT NULL,
	"sections" jsonb NOT NULL,
	"design_tokens" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "agent" varchar(80);--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "entity_type" varchar(80);--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "entity_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "correlation_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD COLUMN "max_attempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "converted_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "social_links" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "opening_hours" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "image_urls" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "intent" "conversation_intent";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "unread_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "recommended_action" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "last_analyzed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "next_action" text;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "preview_url" text;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "production_url" text;--> statement-breakpoint
ALTER TABLE "agent_job_logs" ADD CONSTRAINT "agent_job_logs_job_id_agent_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_source_version_id_website_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."website_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_result_version_id_website_versions_id_fk" FOREIGN KEY ("result_version_id") REFERENCES "public"."website_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_job_logs_job_created_idx" ON "agent_job_logs" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "client_requests_client_status_idx" ON "client_requests" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "conversation_messages_conversation_idx" ON "conversation_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_client_created_idx" ON "payments" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "templates_key_version_unique" ON "templates" USING btree ("key","version");--> statement-breakpoint
CREATE INDEX "templates_category_status_idx" ON "templates" USING btree ("category","status");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

UPDATE "clients" AS client
SET "company_id" = prospect."company_id"
FROM "prospects" AS prospect
WHERE client."prospect_id" = prospect."id"
  AND client."company_id" IS NULL;--> statement-breakpoint

UPDATE "conversations" AS conversation
SET "company_id" = prospect."company_id"
FROM "prospects" AS prospect
WHERE conversation."prospect_id" = prospect."id"
  AND conversation."company_id" IS NULL;--> statement-breakpoint

UPDATE "websites" AS website
SET "company_id" = client."company_id"
FROM "projects" AS project
INNER JOIN "clients" AS client ON client."id" = project."client_id"
WHERE project."website_id" = website."id"
  AND website."company_id" IS NULL
  AND client."company_id" IS NOT NULL;--> statement-breakpoint

UPDATE "agent_jobs"
SET "agent" = CASE
  WHEN "type" LIKE 'research.%' THEN 'Research'
  WHEN "type" LIKE 'analysis.%' THEN 'Analysis'
  WHEN "type" LIKE 'content.%' THEN 'Content'
  WHEN "type" LIKE 'website.%' THEN 'Generation'
  WHEN "type" LIKE 'design.%' THEN 'Design Critic'
  WHEN "type" LIKE 'seo.%' THEN 'SEO'
  WHEN "type" LIKE 'quality.%' OR "type" LIKE 'qa.%' THEN 'QA'
  WHEN "type" LIKE 'deployment.%' THEN 'Deployment'
  ELSE 'System'
END
WHERE "agent" IS NULL;--> statement-breakpoint

INSERT INTO "templates" ("key", "name", "category", "version", "status", "sections", "design_tokens")
VALUES
  ('restaurant', 'Restaurant', 'RESTAURANT', 1, 'ACTIVE', '["Navbar","Hero","About","Menu","Services","Gallery","Reviews","OpeningHours","Location","Contact","CTA","Footer"]'::jsonb, '{"responsive":true,"accessible":true,"seoFriendly":true}'::jsonb),
  ('barber', 'Barber', 'BARBER', 1, 'DRAFT', '[]'::jsonb, '{}'::jsonb),
  ('hairdresser', 'Hairdresser', 'HAIRDRESSER', 1, 'DRAFT', '[]'::jsonb, '{}'::jsonb)
ON CONFLICT ("key", "version") DO NOTHING;--> statement-breakpoint

INSERT INTO "app_settings" ("key", "section", "value", "is_sensitive")
VALUES
  ('ai.defaultProvider', 'AI', '"openai"'::jsonb, false),
  ('ai.maxIterations', 'AI', '3'::jsonb, false),
  ('ai.maxJobBudget', 'AI', '5'::jsonb, false),
  ('agents.maxRetries', 'Agents', '3'::jsonb, false),
  ('agents.humanReviewRequired', 'Agents', 'true'::jsonb, false),
  ('websites.minDesignScore', 'Websites', '80'::jsonb, false),
  ('websites.minSeoScore', 'Websites', '80'::jsonb, false),
  ('websites.minQaScore', 'Websites', '90'::jsonb, false),
  ('communication.humanApproval', 'Communication', 'true'::jsonb, false),
  ('deployment.defaultEnvironment', 'Deployment', '"PREVIEW"'::jsonb, false),
  ('security.auditLogs', 'Security', 'true'::jsonb, false),
  ('business.currency', 'Business', '"EUR"'::jsonb, false)
ON CONFLICT ("key") DO NOTHING;
