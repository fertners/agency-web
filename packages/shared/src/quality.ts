import { z } from 'zod';
import { websiteIdSchema, websiteVersionIdSchema } from './websites.js';

export const QUALITY_PASS_SCORE = 80;
export const qualitySeveritySchema = z.enum([
  'INFO',
  'WARNING',
  'ERROR',
  'BLOCKING',
]);
export const qualityIssueSchema = z
  .object({
    code: z.string().min(1),
    severity: qualitySeveritySchema,
    message: z.string().min(1),
    suggestion: z.string().min(1),
    target: z.string().optional(),
  })
  .strict();
export const seoAuditSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    passed: z.boolean(),
    checks: z.record(z.string(), z.boolean()),
    issues: z.array(qualityIssueSchema),
  })
  .strict();
export const accessibilityAuditSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    violations: z.number().int().nonnegative(),
    issues: z.array(qualityIssueSchema),
  })
  .strict();
export const performanceAuditSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    loadTimeMs: z.number().int().nonnegative(),
    domContentLoadedMs: z.number().int().nonnegative(),
    resourceCount: z.number().int().nonnegative(),
    transferBytes: z.number().int().nonnegative(),
    issues: z.array(qualityIssueSchema),
  })
  .strict();
export const qualityReportSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    status: z.enum(['PASSED', 'FAILED', 'NEEDS_REVIEW']),
    seo: seoAuditSchema,
    accessibility: accessibilityAuditSchema,
    performance: performanceAuditSchema,
    issues: z.array(qualityIssueSchema),
    summary: z.string().min(1),
  })
  .strict();
export const qualityJobPayloadSchema = z
  .object({ websiteId: websiteIdSchema, versionId: websiteVersionIdSchema })
  .strict();
export const qualityJobResultSchema = z
  .object({
    reportId: z.uuid(),
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    score: z.number().int().min(0).max(100),
    status: z.enum(['PASSED', 'FAILED', 'NEEDS_REVIEW']),
  })
  .strict();
export const createQualityReviewResponseSchema = z
  .object({ jobId: z.uuid(), status: z.literal('PENDING') })
  .strict();
export const qualityReportResponseSchema = z
  .object({
    reportId: z.uuid(),
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']),
    report: qualityReportSchema.nullable(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();
export const qualityReportListResponseSchema = z
  .object({ reports: z.array(qualityReportResponseSchema) })
  .strict();
export type QualityIssue = z.infer<typeof qualityIssueSchema>;
export type SeoAudit = z.infer<typeof seoAuditSchema>;
export type AccessibilityAudit = z.infer<typeof accessibilityAuditSchema>;
export type PerformanceAudit = z.infer<typeof performanceAuditSchema>;
export type QualityReport = z.infer<typeof qualityReportSchema>;
export type QualityJobPayload = z.infer<typeof qualityJobPayloadSchema>;
export type QualityJobResult = z.infer<typeof qualityJobResultSchema>;
export type CreateQualityReviewResponse = z.infer<
  typeof createQualityReviewResponseSchema
>;
export type QualityReportResponse = z.infer<typeof qualityReportResponseSchema>;
export type QualityReportListResponse = z.infer<
  typeof qualityReportListResponseSchema
>;
