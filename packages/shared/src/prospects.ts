import { z } from 'zod';

import { brandProfileSchema } from './branding.js';

export const businessCategorySchema = z.enum(['RESTAURANT']);
export const PROSPECT_STATUSES = [
  'NEW',
  'DISCOVERED',
  'ANALYZING',
  'QUALIFIED',
  'PREVIEW_GENERATED',
  'REVIEW_REQUIRED',
  'CONTACT_READY',
  'CONTACTED',
  'RESPONDED',
  'REPLIED',
  'INTERESTED',
  'PROPOSAL_SENT',
  'CONVERTED',
  'WON',
  'LOST',
  'DISMISSED',
  'ARCHIVED',
] as const;
export const prospectStatusSchema = z.enum(PROSPECT_STATUSES);
export const prospectIdSchema = z.uuid();
export type ProspectStatus = z.infer<typeof prospectStatusSchema>;
export const PROSPECT_TRANSITIONS: Readonly<
  Record<ProspectStatus, readonly ProspectStatus[]>
> = {
  NEW: ['DISCOVERED', 'QUALIFIED', 'ARCHIVED'],
  DISCOVERED: ['ANALYZING', 'QUALIFIED', 'ARCHIVED'],
  ANALYZING: ['QUALIFIED', 'REVIEW_REQUIRED', 'LOST', 'ARCHIVED'],
  QUALIFIED: [
    'PREVIEW_GENERATED',
    'CONTACT_READY',
    'CONTACTED',
    'LOST',
    'ARCHIVED',
  ],
  PREVIEW_GENERATED: [
    'REVIEW_REQUIRED',
    'CONTACT_READY',
    'CONTACTED',
    'ARCHIVED',
  ],
  REVIEW_REQUIRED: ['PREVIEW_GENERATED', 'QUALIFIED', 'LOST', 'ARCHIVED'],
  CONTACT_READY: ['CONTACTED', 'LOST', 'ARCHIVED'],
  CONTACTED: ['REPLIED', 'RESPONDED', 'LOST', 'ARCHIVED'],
  RESPONDED: ['INTERESTED', 'REPLIED', 'LOST', 'ARCHIVED'],
  REPLIED: ['INTERESTED', 'LOST', 'ARCHIVED'],
  INTERESTED: ['PROPOSAL_SENT', 'WON', 'LOST', 'ARCHIVED'],
  PROPOSAL_SENT: ['WON', 'LOST', 'ARCHIVED'],
  CONVERTED: ['WON', 'ARCHIVED'],
  WON: ['ARCHIVED'],
  LOST: ['ARCHIVED', 'QUALIFIED'],
  DISMISSED: ['LOST', 'ARCHIVED'],
  ARCHIVED: ['DISCOVERED'],
};
export function isProspectTransitionAllowed(
  from: ProspectStatus,
  to: ProspectStatus,
): boolean {
  return from === to || PROSPECT_TRANSITIONS[from].includes(to);
}
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
    description: z.string().trim().min(1).max(2_000).optional(),
    category: businessCategorySchema,
    countryCode: z.string().length(2),
    city: z.string().min(1),
    street: z.string().optional(),
    postalCode: z.string().optional(),
    websiteUrl: z.url().optional(),
    email: z.email().optional(),
    phone: z.string().min(4).optional(),
    cuisines: z.array(z.string().trim().min(1)).max(20).default([]),
    openingHoursRaw: z.string().trim().min(1).max(1_000).optional(),
    socialLinks: z.record(z.string(), z.url()).optional(),
    logoUrl: z.url().optional(),
    imageUrls: z.array(z.url()).max(20).default([]),
    brandProfile: brandProfileSchema.optional(),
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
