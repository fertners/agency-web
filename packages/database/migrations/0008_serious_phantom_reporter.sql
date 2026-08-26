CREATE TYPE "public"."client_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."deployment_environment" AS ENUM('PREVIEW', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "public"."deployment_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('PLANNED', 'ACTIVE', 'DELIVERED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "client_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"website_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"agent_job_id" uuid,
	"environment" "deployment_environment" NOT NULL,
	"status" "deployment_status" DEFAULT 'PENDING' NOT NULL,
	"provider" varchar(80) DEFAULT 'local-preview' NOT NULL,
	"url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"replaces_deployment_id" uuid,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "project_status" DEFAULT 'PLANNED' NOT NULL,
	"website_id" uuid,
	"version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_version_id_website_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."website_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_agent_job_id_agent_jobs_id_fk" FOREIGN KEY ("agent_job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_version_id_website_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."website_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_prospect_unique" ON "clients" USING btree ("prospect_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deployments_agent_job_unique" ON "deployments" USING btree ("agent_job_id");--> statement-breakpoint
CREATE INDEX "deployments_project_created_idx" ON "deployments" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_proposal_unique" ON "projects" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "projects_client_idx" ON "projects" USING btree ("client_id");