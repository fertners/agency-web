CREATE TYPE "public"."quality_report_status" AS ENUM('RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "quality_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"website_version_id" uuid NOT NULL,
	"agent_job_id" uuid NOT NULL,
	"status" "quality_report_status" DEFAULT 'RUNNING' NOT NULL,
	"report" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "quality_reports" ADD CONSTRAINT "quality_reports_website_version_id_website_versions_id_fk" FOREIGN KEY ("website_version_id") REFERENCES "public"."website_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_reports" ADD CONSTRAINT "quality_reports_agent_job_id_agent_jobs_id_fk" FOREIGN KEY ("agent_job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quality_reports_job_unique" ON "quality_reports" USING btree ("agent_job_id");--> statement-breakpoint
CREATE INDEX "quality_reports_version_created_idx" ON "quality_reports" USING btree ("website_version_id","created_at");