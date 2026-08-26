CREATE TYPE "public"."proposal_website_type" AS ENUM('SHOWCASE', 'DYNAMIC');--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "website_type" "proposal_website_type" DEFAULT 'SHOWCASE' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "preview_image_url" text;
