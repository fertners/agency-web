CREATE TYPE "public"."prospect_status" AS ENUM('NEW', 'QUALIFIED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"source" varchar(80) NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"city" text NOT NULL,
	"street" text,
	"postal_code" text,
	"website_url" text,
	"email" text,
	"phone" text,
	"raw" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"status" "prospect_status" DEFAULT 'NEW' NOT NULL,
	"opportunity_score" integer,
	"assessment" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_fingerprint_unique" ON "companies" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "companies_location_category_idx" ON "companies" USING btree ("country_code","city","category");--> statement-breakpoint
CREATE UNIQUE INDEX "prospects_company_unique" ON "prospects" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "prospects_score_idx" ON "prospects" USING btree ("opportunity_score");