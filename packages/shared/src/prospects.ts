import { z } from 'zod';

export const businessCategorySchema = z.enum(['RESTAURANT']);
export const PROSPECT_STATUSES = [
  'NEW',
  'QUALIFIED',
  'CONTACT_READY',
  'CONTACTED',
  'RESPONDED',
  'CONVERTED',
  'DISMISSED',
] as const;
export const prospectStatusSchema = z.enum(PROSPECT_STATUSES);
export const prospectSearchRequestSchema = z
  .object({
    countryCode: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    city: z.string().trim().min(2).max(120),
    category: businessCategorySchema.default('RESTAURANT'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
export const companyCandidateSchema = z
  .object({
    source: z.string().min(1),
    externalId: z.string().min(1).optional(),
    name: z.string().trim().min(1),
    category: businessCategorySchema,
    countryCode: z.string().length(2),
    city: z.string().min(1),
    street: z.string().optional(),
    postalCode: z.string().optional(),
    websiteUrl: z.url().optional(),
    email: z.email().optional(),
    phone: z.string().min(4).optional(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().nonnegative().optional(),
    signals: z
      .object({
        mobileFriendly: z.boolean().optional(),
        https: z.boolean().optional(),
        hasTitle: z.boolean().optional(),
        hasDescription: z.boolean().optional(),
        hasOnlineBooking: z.boolean().optional(),
        hasMenu: z.boolean().optional(),
        loadTimeMs: z.number().int().positive().optional(),
      })
      .default({}),
  })
  .strict();

export const opportunityComponentsSchema = z
  .object({
    websiteQuality: z.number().int().min(0).max(100),
    mobile: z.number().int().min(0).max(100),
    seo: z.number().int().min(0).max(100),
    businessQuality: z.number().int().min(0).max(100),
    missingFeatures: z.number().int().min(0).max(100),
    contactability: z.number().int().min(0).max(100),
  })
  .strict();
export const opportunityAssessmentSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    components: opportunityComponentsSchema,
    summary: z.string().min(1),
    evidence: z.array(z.string().min(1)),
    weights: opportunityComponentsSchema,
  })
  .strict();
export const prospectSearchJobPayloadSchema = prospectSearchRequestSchema;
export const prospectSearchJobResultSchema = z
  .object({
    jobId: z.uuid(),
    discovered: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
  })
  .strict();
export const createProspectSearchResponseSchema = z
  .object({ jobId: z.uuid(), status: z.literal('PENDING') })
  .strict();
export const prospectSummarySchema = z
  .object({
    prospectId: z.uuid(),
    companyId: z.uuid(),
    name: z.string(),
    source: z.string().min(1),
    category: businessCategorySchema,
    city: z.string(),
    countryCode: z.string(),
    websiteUrl: z.url().nullable(),
    email: z.email().nullable(),
    phone: z.string().nullable(),
    status: prospectStatusSchema,
    opportunityScore: z.number().int().min(0).max(100).nullable(),
    assessment: opportunityAssessmentSchema.nullable(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const prospectListResponseSchema = z
  .object({ prospects: z.array(prospectSummarySchema) })
  .strict();

export type BusinessCategory = z.infer<typeof businessCategorySchema>;
export type ProspectStatus = z.infer<typeof prospectStatusSchema>;
export type ProspectSearchRequest = z.infer<typeof prospectSearchRequestSchema>;
export type CompanyCandidate = z.infer<typeof companyCandidateSchema>;
export type OpportunityComponents = z.infer<typeof opportunityComponentsSchema>;
export type OpportunityAssessment = z.infer<typeof opportunityAssessmentSchema>;
export type ProspectSearchJobPayload = z.infer<
  typeof prospectSearchJobPayloadSchema
>;
export type ProspectSearchJobResult = z.infer<
  typeof prospectSearchJobResultSchema
>;
export type CreateProspectSearchResponse = z.infer<
  typeof createProspectSearchResponseSchema
>;
export type ProspectSummary = z.infer<typeof prospectSummarySchema>;
export type ProspectListResponse = z.infer<typeof prospectListResponseSchema>;
