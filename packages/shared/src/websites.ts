import { z } from 'zod';

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
export const RESTAURANT_SERVICES = [
  'DINE_IN',
  'TAKEAWAY',
  'DELIVERY',
  'RESERVATIONS',
  'TERRACE',
  'PRIVATE_EVENTS',
] as const;
export const RESTAURANT_SECTIONS = [
  'NAVBAR',
  'HERO',
  'ABOUT',
  'SPECIALTIES',
  'SERVICES',
  'GALLERY',
  'REVIEWS',
  'OPENING_HOURS',
  'LOCATION',
  'CONTACT',
  'CTA',
  'FOOTER',
] as const;
export const WEBSITE_STATUSES = [
  'DRAFT',
  'GENERATING',
  'READY',
  'ARCHIVED',
] as const;
export const WEBSITE_VERSION_STATUSES = [
  'DRAFT',
  'GENERATING',
  'READY',
  'APPROVED',
  'REJECTED',
] as const;

const nonEmptyTextSchema = z.string().trim().min(1);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const weekdaySchema = z.enum(WEEKDAYS);
export const restaurantServiceSchema = z.enum(RESTAURANT_SERVICES);
export const restaurantSectionSchema = z.enum(RESTAURANT_SECTIONS);
export const websiteStatusSchema = z.enum(WEBSITE_STATUSES);
export const websiteVersionStatusSchema = z.enum(WEBSITE_VERSION_STATUSES);

export const addressSchema = z
  .object({
    street: nonEmptyTextSchema,
    postalCode: nonEmptyTextSchema,
    city: nonEmptyTextSchema,
    countryCode: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
  })
  .strict();

export const restaurantContactSchema = z
  .object({
    phone: nonEmptyTextSchema.optional(),
    email: z.email().optional(),
    website: z.url().optional(),
  })
  .strict()
  .refine((contact) => Object.values(contact).some(Boolean), {
    message: 'At least one contact method is required',
  });

export const openingHoursSchema = z.discriminatedUnion('closed', [
  z.object({ day: weekdaySchema, closed: z.literal(true) }).strict(),
  z
    .object({
      day: weekdaySchema,
      closed: z.literal(false),
      opensAt: timeSchema,
      closesAt: timeSchema,
    })
    .strict(),
]);

export const menuHighlightSchema = z
  .object({
    name: nonEmptyTextSchema,
    description: nonEmptyTextSchema,
    price: z.number().nonnegative().optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .strict()
  .refine((item) => item.price === undefined || item.currency !== undefined, {
    message: 'Currency is required when a price is provided',
    path: ['currency'],
  });

export const restaurantImageSchema = z
  .object({
    url: z.url(),
    alt: nonEmptyTextSchema.max(160),
  })
  .strict();

export const restaurantReviewSchema = z
  .object({
    author: nonEmptyTextSchema.max(100),
    quote: nonEmptyTextSchema.max(500),
    rating: z.number().int().min(1).max(5),
  })
  .strict();

export const restaurantBusinessDataSchema = z
  .object({
    kind: z.literal('RESTAURANT'),
    name: nonEmptyTextSchema,
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    tagline: nonEmptyTextSchema.optional(),
    description: nonEmptyTextSchema,
    cuisines: z.array(nonEmptyTextSchema).min(1).max(10),
    address: addressSchema,
    contact: restaurantContactSchema,
    openingHours: z.array(openingHoursSchema).max(7),
    services: z.array(restaurantServiceSchema).max(RESTAURANT_SERVICES.length),
    menuHighlights: z.array(menuHighlightSchema).max(12),
    heroImage: restaurantImageSchema.optional(),
    gallery: z.array(restaurantImageSchema).max(12).default([]),
    reviews: z.array(restaurantReviewSchema).max(8).default([]),
  })
  .strict()
  .superRefine((business, context) => {
    const days = business.openingHours.map(({ day }) => day);
    if (new Set(days).size !== days.length) {
      context.addIssue({
        code: 'custom',
        message: 'Opening hours must contain at most one entry per day',
        path: ['openingHours'],
      });
    }
  });

export const restaurantContentBriefSchema = z
  .object({
    headline: nonEmptyTextSchema.max(90),
    subheadline: nonEmptyTextSchema.max(180),
    about: nonEmptyTextSchema.max(1_500),
    primaryCallToAction: nonEmptyTextSchema.max(40),
    specialtiesHeading: nonEmptyTextSchema.max(80),
    seoTitle: nonEmptyTextSchema.max(60),
    seoDescription: nonEmptyTextSchema.max(160),
  })
  .strict();

export const restaurantDesignBriefSchema = z
  .object({
    tone: z.enum(['ELEGANT', 'WARM', 'MODERN', 'RUSTIC', 'PLAYFUL']),
    primaryColor: hexColorSchema,
    accentColor: hexColorSchema,
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    styleKeywords: z.array(nonEmptyTextSchema).min(1).max(6),
  })
  .strict();

export const restaurantBriefsSchema = z
  .object({
    content: restaurantContentBriefSchema,
    design: restaurantDesignBriefSchema,
  })
  .strict();

export const restaurantWebsiteConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    business: restaurantBusinessDataSchema,
    content: restaurantContentBriefSchema,
    design: restaurantDesignBriefSchema,
    sections: z
      .array(restaurantSectionSchema)
      .min(1)
      .max(RESTAURANT_SECTIONS.length),
    generatedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((config, context) => {
    if (new Set(config.sections).size !== config.sections.length) {
      context.addIssue({
        code: 'custom',
        message: 'Website sections must be unique',
        path: ['sections'],
      });
    }
  });

export const websiteIdSchema = z.uuid();
export const websiteVersionIdSchema = z.uuid();

export const websiteVersionResponseSchema = z
  .object({
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    version: z.number().int().positive(),
    status: websiteVersionStatusSchema,
    config: restaurantWebsiteConfigSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const websiteVersionListResponseSchema = z
  .object({ versions: z.array(websiteVersionResponseSchema) })
  .strict();

export const createRestaurantWebsiteRequestSchema =
  restaurantBusinessDataSchema;

export const generationJobPayloadSchema = z
  .object({
    websiteId: websiteIdSchema,
  })
  .strict();

export const createRestaurantWebsiteResponseSchema = z
  .object({
    websiteId: websiteIdSchema,
    jobId: z.uuid(),
    status: z.literal('PENDING'),
  })
  .strict();

export const generationJobResultSchema = z
  .object({
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    version: z.number().int().positive(),
    previewPath: z.string().startsWith('/preview/'),
  })
  .strict();

export const websiteSummarySchema = z
  .object({
    websiteId: websiteIdSchema,
    businessId: z.uuid(),
    name: nonEmptyTextSchema,
    slug: nonEmptyTextSchema,
    status: websiteStatusSchema,
    templateKey: nonEmptyTextSchema,
    latestVersion: z
      .object({
        versionId: websiteVersionIdSchema,
        version: z.number().int().positive(),
        status: websiteVersionStatusSchema,
      })
      .strict()
      .nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const websiteListResponseSchema = z
  .object({ websites: z.array(websiteSummarySchema) })
  .strict();

export type Weekday = z.infer<typeof weekdaySchema>;
export type RestaurantService = z.infer<typeof restaurantServiceSchema>;
export type RestaurantSection = z.infer<typeof restaurantSectionSchema>;
export type RestaurantBusinessData = z.infer<
  typeof restaurantBusinessDataSchema
>;
export type RestaurantImage = z.infer<typeof restaurantImageSchema>;
export type RestaurantReview = z.infer<typeof restaurantReviewSchema>;
export type RestaurantContentBrief = z.infer<
  typeof restaurantContentBriefSchema
>;
export type RestaurantDesignBrief = z.infer<typeof restaurantDesignBriefSchema>;
export type RestaurantBriefs = z.infer<typeof restaurantBriefsSchema>;
export type RestaurantWebsiteConfig = z.infer<
  typeof restaurantWebsiteConfigSchema
>;
export type WebsiteStatus = z.infer<typeof websiteStatusSchema>;
export type WebsiteVersionStatus = z.infer<typeof websiteVersionStatusSchema>;
export type WebsiteId = z.infer<typeof websiteIdSchema>;
export type WebsiteVersionId = z.infer<typeof websiteVersionIdSchema>;
export type WebsiteVersionResponse = z.infer<
  typeof websiteVersionResponseSchema
>;
export type WebsiteVersionListResponse = z.infer<
  typeof websiteVersionListResponseSchema
>;
export type CreateRestaurantWebsiteRequest = z.infer<
  typeof createRestaurantWebsiteRequestSchema
>;
export type CreateRestaurantWebsiteResponse = z.infer<
  typeof createRestaurantWebsiteResponseSchema
>;
export type GenerationJobPayload = z.infer<typeof generationJobPayloadSchema>;
export type GenerationJobResult = z.infer<typeof generationJobResultSchema>;
export type WebsiteSummary = z.infer<typeof websiteSummarySchema>;
export type WebsiteListResponse = z.infer<typeof websiteListResponseSchema>;
