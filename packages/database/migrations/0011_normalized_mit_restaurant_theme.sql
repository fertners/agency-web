INSERT INTO "templates" (
  "key",
  "name",
  "category",
  "version",
  "status",
  "sections",
  "design_tokens"
)
VALUES (
  'restaurant-chefs-kitchen-v1',
  'Restaurant Chef''s Kitchen',
  'RESTAURANT',
  1,
  'ACTIVE',
  '["Navbar","Hero","About","Menu","Services","Gallery","Reviews","OpeningHours","Location","Contact","CTA","Footer"]'::jsonb,
  '{"primaryColor":"#DF6853","accentColor":"#F2B84B","backgroundColor":"#F9FAFB","textColor":"#111111","headingFont":"Arial, sans-serif","bodyFont":"Inter, ui-sans-serif, system-ui, sans-serif","buttonRadius":"PILL","heroLayout":"SPLIT","sourceKind":"NORMALIZED_MIT","sourceUrl":"https://github.com/GetNextjsTemplates/chef-kitchen-nextjs-landing-page-template","sourceCommit":"2910c50abefa7a367015697f4cd5b96be95771fb","license":"MIT","assetsIncluded":false}'::jsonb
)
ON CONFLICT ("key", "version") DO UPDATE SET
  "name" = excluded."name",
  "status" = excluded."status",
  "sections" = excluded."sections",
  "design_tokens" = excluded."design_tokens",
  "updated_at" = now();
