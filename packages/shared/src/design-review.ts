import { z } from 'zod';

import {
  restaurantWebsiteConfigSchema,
  websiteIdSchema,
  websiteVersionIdSchema,
} from './websites.js';

export const DESIGN_REVIEW_MAX_ITERATIONS = 3;
export const DESIGN_REVIEW_PASS_SCORE = 80;
export const designReviewCategorySchema = z.enum([
  'VISUAL_HIERARCHY',
  'TYPOGRAPHY',
  'SPACING',
  'COLORS',
  'CTA',
  'MOBILE',
  'CONSISTENCY',
  'INDUSTRY_FIT',
  'ACCESSIBILITY',
  'PROFESSIONALISM',
]);
export const designIssueSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'BLOCKING',
]);
export const browserViewportSchema = z.enum(['DESKTOP', 'MOBILE']);
export const browserIssueSchema = z
  .object({
    code: z.string().trim().min(1),
    severity: designIssueSeveritySchema,
    message: z.string().trim().min(1),
    viewport: browserViewportSchema.optional(),
  })
  .strict();
export const screenshotArtifactSchema = z
  .object({
    kind: z.enum(['DESKTOP_SCREENSHOT', 'MOBILE_SCREENSHOT']),
    path: z.string().trim().min(1),
    mimeType: z.literal('image/png'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();
export const browserReviewReportSchema = z
  .object({
    url: z.url(),
    statusCode: z.number().int().min(100).max(599),
    title: z.string(),
    javascriptErrors: z.array(z.string()),
    failedRequests: z.array(z.string()),
    linksChecked: z.number().int().nonnegative(),
    formsChecked: z.number().int().nonnegative(),
    hasHorizontalOverflow: z.boolean(),
    issues: z.array(browserIssueSchema),
    screenshots: z.array(screenshotArtifactSchema).length(2),
  })
  .strict();
export const designReviewIssueSchema = z
  .object({
    code: z.string().trim().min(1),
    severity: designIssueSeveritySchema,
    category: designReviewCategorySchema,
    message: z.string().trim().min(1),
    suggestion: z.string().trim().min(1),
    target: z.string().trim().min(1).optional(),
  })
  .strict();
const scoreSchema = z.number().int().min(0).max(10);
export const designReviewScoresSchema = z
  .object({
    visualHierarchy: scoreSchema,
    typography: scoreSchema,
    spacing: scoreSchema,
    colors: scoreSchema,
    cta: scoreSchema,
    mobile: scoreSchema,
    consistency: scoreSchema,
    industryFit: scoreSchema,
    accessibility: scoreSchema,
    professionalism: scoreSchema,
  })
  .strict();
export const designReviewResultSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    categories: designReviewScoresSchema,
    issues: z.array(designReviewIssueSchema).max(50),
    summary: z.string().trim().min(1).max(2_000),
  })
  .strict();
export const websiteCorrectionPatchSchema = z
  .object({
    content: restaurantWebsiteConfigSchema.shape.content.partial().optional(),
    design: restaurantWebsiteConfigSchema.shape.design.partial().optional(),
    sections: restaurantWebsiteConfigSchema.shape.sections.optional(),
  })
  .strict();
export const designReviewJobPayloadSchema = z
  .object({
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    iteration: z.number().int().min(1).max(DESIGN_REVIEW_MAX_ITERATIONS),
  })
  .strict();
export const designReviewJobResultSchema = z
  .object({
    reviewId: z.uuid(),
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    iteration: z.number().int().min(1).max(DESIGN_REVIEW_MAX_ITERATIONS),
    score: z.number().int().min(0).max(100),
    passed: z.boolean(),
    correctedVersionId: websiteVersionIdSchema.nullable(),
  })
  .strict();
export const createDesignReviewResponseSchema = z
  .object({ jobId: z.uuid(), status: z.literal('PENDING') })
  .strict();
export const designReviewResponseSchema = z
  .object({
    reviewId: z.uuid(),
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    correctedVersionId: websiteVersionIdSchema.nullable(),
    iteration: z.number().int().min(1).max(DESIGN_REVIEW_MAX_ITERATIONS),
    status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']),
    result: designReviewResultSchema.nullable(),
    browserReport: browserReviewReportSchema.nullable(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();
export const designReviewListResponseSchema = z
  .object({ reviews: z.array(designReviewResponseSchema) })
  .strict();

export type BrowserReviewReport = z.infer<typeof browserReviewReportSchema>;
export type DesignReviewResult = z.infer<typeof designReviewResultSchema>;
export type WebsiteCorrectionPatch = z.infer<
  typeof websiteCorrectionPatchSchema
>;
export type DesignReviewJobPayload = z.infer<
  typeof designReviewJobPayloadSchema
>;
export type DesignReviewJobResult = z.infer<typeof designReviewJobResultSchema>;
export type CreateDesignReviewResponse = z.infer<
  typeof createDesignReviewResponseSchema
>;
export type DesignReviewResponse = z.infer<typeof designReviewResponseSchema>;
export type DesignReviewListResponse = z.infer<
  typeof designReviewListResponseSchema
>;
