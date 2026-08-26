UPDATE "templates"
SET "status" = 'DEPRECATED', "updated_at" = now()
WHERE "key" = 'restaurant' AND "version" = 1;--> statement-breakpoint

INSERT INTO "templates" (
  "key",
  "name",
  "category",
  "version",
  "status",
  "sections",
  "design_tokens"
)
VALUES
  (
    'restaurant-elegant-v1',
    'Restaurant Editorial',
    'RESTAURANT',
    1,
    'ACTIVE',
    '["Navbar","Hero","About","Menu","Services","Gallery","Reviews","OpeningHours","Location","Contact","CTA","Footer"]'::jsonb,
    '{"primaryColor":"#17231B","accentColor":"#C89348","backgroundColor":"#FAF7F0","textColor":"#18201A","headingFont":"Georgia, serif","bodyFont":"Inter, ui-sans-serif, system-ui, sans-serif","buttonRadius":"PILL","sourceKind":"INTERNAL_NORMALIZED"}'::jsonb
  ),
  (
    'restaurant-warm-v1',
    'Restaurant Maison',
    'RESTAURANT',
    1,
    'ACTIVE',
    '["Navbar","Hero","About","Menu","Services","Gallery","Reviews","OpeningHours","Location","Contact","CTA","Footer"]'::jsonb,
    '{"primaryColor":"#6D2E1C","accentColor":"#E0A458","backgroundColor":"#FFF8ED","textColor":"#2F211C","headingFont":"Georgia, serif","bodyFont":"Inter, ui-sans-serif, system-ui, sans-serif","buttonRadius":"SOFT","sourceKind":"INTERNAL_NORMALIZED"}'::jsonb
  ),
  (
    'restaurant-modern-v1',
    'Restaurant Studio',
    'RESTAURANT',
    1,
    'ACTIVE',
    '["Navbar","Hero","About","Menu","Services","Gallery","Reviews","OpeningHours","Location","Contact","CTA","Footer"]'::jsonb,
    '{"primaryColor":"#111827","accentColor":"#84CC16","backgroundColor":"#F8FAFC","textColor":"#111827","headingFont":"Arial, sans-serif","bodyFont":"Inter, ui-sans-serif, system-ui, sans-serif","buttonRadius":"NONE","sourceKind":"INTERNAL_NORMALIZED"}'::jsonb
  )
ON CONFLICT ("key", "version") DO UPDATE SET
  "name" = excluded."name",
  "status" = excluded."status",
  "sections" = excluded."sections",
  "design_tokens" = excluded."design_tokens",
  "updated_at" = now();--> statement-breakpoint

UPDATE "websites"
SET "template_key" = 'restaurant-elegant-v1', "updated_at" = now()
WHERE "template_key" IN ('restaurant', 'restaurant-v1');
