import { z } from 'zod';

export const BRAND_SOURCE_TYPES = [
  'USER_PROVIDED',
  'OFFICIAL_WEBSITE',
  'OPENSTREETMAP',
  'PUBLIC_DIRECTORY',
  'SOCIAL_PROFILE',
] as const;
export const BRAND_ASSET_TYPES = ['LOGO', 'HERO', 'GALLERY'] as const;
export const ASSET_USAGE_STATUSES = [
  'VERIFIED',
  'PENDING_REVIEW',
  'REJECTED',
] as const;
export const RESTAURANT_THEME_KEYS = [
  'restaurant-elegant-v1',
  'restaurant-warm-v1',
  'restaurant-modern-v1',
  'restaurant-chefs-kitchen-v1',
] as const;

const nonEmptyTextSchema = z.string().trim().min(1);
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const brandEvidenceSchema = z
  .object({
    id: nonEmptyTextSchema.max(100),
    type: z.enum(BRAND_SOURCE_TYPES),
    url: z.url().optional(),
    capturedAt: z.iso.datetime(),
    claims: z.array(nonEmptyTextSchema.max(100)).min(1).max(30),
  })
  .strict();

export const brandAssetSchema = z
  .object({
    type: z.enum(BRAND_ASSET_TYPES),
    url: z.url(),
    alt: nonEmptyTextSchema.max(160),
    sourceId: nonEmptyTextSchema.max(100),
    sourceUrl: z.url().optional(),
    usageStatus: z.enum(ASSET_USAGE_STATUSES),
  })
  .strict();

export const brandProfileSchema = z
  .object({
    businessName: nonEmptyTextSchema.max(200),
    category: z.literal('RESTAURANT'),
    colors: z.array(hexColorSchema).max(6),
    headingFont: nonEmptyTextSchema.max(100).optional(),
    bodyFont: nonEmptyTextSchema.max(100).optional(),
    styleKeywords: z.array(nonEmptyTextSchema.max(60)).max(8),
    assets: z.array(brandAssetSchema).max(20),
    confidence: z.number().min(0).max(1),
    sources: z.array(brandEvidenceSchema).min(1).max(20),
  })
  .strict();

export const contentProfileSchema = z
  .object({
    sourceIds: z.array(nonEmptyTextSchema.max(100)).min(1).max(20),
    verifiedFacts: z.array(nonEmptyTextSchema.max(100)).min(1).max(50),
    omittedSections: z.array(nonEmptyTextSchema.max(100)).max(20),
    warnings: z.array(nonEmptyTextSchema.max(300)).max(20),
  })
  .strict();

export const restaurantThemeKeySchema = z.enum(RESTAURANT_THEME_KEYS);
export const themeSelectionSchema = z
  .object({
    themeKey: restaurantThemeKeySchema,
    reason: nonEmptyTextSchema.max(500),
    usedCategoryFallback: z.boolean(),
    matchedSignals: z.array(nonEmptyTextSchema.max(100)).max(20),
  })
  .strict();

export const websiteGenerationContextSchema = z
  .object({
    brand: brandProfileSchema,
    content: contentProfileSchema,
    theme: themeSelectionSchema,
  })
  .strict();

export type BrandEvidence = z.infer<typeof brandEvidenceSchema>;
export type BrandAsset = z.infer<typeof brandAssetSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type ContentProfile = z.infer<typeof contentProfileSchema>;
export type RestaurantThemeKey = z.infer<typeof restaurantThemeKeySchema>;
export type ThemeSelection = z.infer<typeof themeSelectionSchema>;
export type WebsiteGenerationContext = z.infer<
  typeof websiteGenerationContextSchema
>;
