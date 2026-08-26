CREATE TYPE "public"."design_review_status" AS ENUM('RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "design_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"website_version_id" uuid NOT NULL,
	"corrected_version_id" uuid,
	"agent_job_id" uuid NOT NULL,
	"iteration" integer NOT NULL,
	"status" "design_review_status" DEFAULT 'RUNNING' NOT NULL,
	"browser_report" jsonb,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_website_version_id_website_versions_id_fk" FOREIGN KEY ("website_version_id") REFERENCES "public"."website_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_corrected_version_id_website_versions_id_fk" FOREIGN KEY ("corrected_version_id") REFERENCES "public"."website_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_agent_job_id_agent_jobs_id_fk" FOREIGN KEY ("agent_job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "design_reviews_version_iteration_unique" ON "design_reviews" USING btree ("website_version_id","iteration");--> statement-breakpoint
CREATE INDEX "design_reviews_version_created_idx" ON "design_reviews" USING btree ("website_version_id","created_at");