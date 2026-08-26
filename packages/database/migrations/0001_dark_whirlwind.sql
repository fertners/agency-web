CREATE TYPE "public"."website_status" AS ENUM('DRAFT', 'GENERATING', 'READY', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."website_version_status" AS ENUM('DRAFT', 'GENERATING', 'READY', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_kind_supported" CHECK ("businesses"."kind" = 'RESTAURANT')
);
--> statement-breakpoint
CREATE TABLE "website_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"website_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "website_version_status" DEFAULT 'DRAFT' NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_versions_version_positive" CHECK ("website_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"template_key" varchar(100) DEFAULT 'restaurant-v1' NOT NULL,
	"status" "website_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "website_versions" ADD CONSTRAINT "website_versions_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_unique" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "website_versions_website_version_unique" ON "website_versions" USING btree ("website_id","version");--> statement-breakpoint
CREATE INDEX "website_versions_website_created_at_idx" ON "website_versions" USING btree ("website_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "websites_business_id_unique" ON "websites" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "websites_status_created_at_idx" ON "websites" USING btree ("status","created_at");