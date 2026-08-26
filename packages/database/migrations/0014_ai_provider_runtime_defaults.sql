UPDATE "app_settings"
SET "value" = '"local"'::jsonb, "updated_at" = now()
WHERE "key" = 'ai.defaultProvider' AND "value" = '"openai"'::jsonb;--> statement-breakpoint
INSERT INTO "app_settings" ("key", "section", "value", "is_sensitive")
VALUES ('ai.model', 'AI', '"gpt-5.4-mini"'::jsonb, false)
ON CONFLICT ("key") DO NOTHING;
