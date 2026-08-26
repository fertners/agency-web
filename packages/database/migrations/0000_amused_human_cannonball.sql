CREATE TYPE "public"."agent_job_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');--> statement-breakpoint
CREATE TABLE "agent_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(100) NOT NULL,
	"status" "agent_job_status" DEFAULT 'PENDING' NOT NULL,
	"queue_name" varchar(100),
	"queue_job_id" varchar(255),
	"input" jsonb NOT NULL,
	"output" jsonb,
	"error" text,
	"attempt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_jobs_attempt_nonnegative" CHECK ("agent_jobs"."attempt" >= 0)
);
--> statement-breakpoint
CREATE INDEX "agent_jobs_status_created_at_idx" ON "agent_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_jobs_queue_identity_idx" ON "agent_jobs" USING btree ("queue_name","queue_job_id");