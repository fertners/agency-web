CREATE TABLE "ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"provider" varchar(100) NOT NULL,
	"model" varchar(150) NOT NULL,
	"context" varchar(150) NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_micros" integer,
	"duration_ms" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_calls_duration_nonnegative" CHECK ("ai_calls"."duration_ms" >= 0),
	CONSTRAINT "ai_calls_tokens_cost_nonnegative" CHECK (("ai_calls"."input_tokens" is null or "ai_calls"."input_tokens" >= 0)
        and ("ai_calls"."output_tokens" is null or "ai_calls"."output_tokens" >= 0)
        and ("ai_calls"."cost_micros" is null or "ai_calls"."cost_micros" >= 0))
);
--> statement-breakpoint
ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_job_id_agent_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_calls_job_created_at_idx" ON "ai_calls" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_calls_provider_model_idx" ON "ai_calls" USING btree ("provider","model");