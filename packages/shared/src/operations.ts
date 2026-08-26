import { z } from 'zod';

import { agentJobStatusSchema } from './jobs.js';
import { prospectStatusSchema } from './prospects.js';

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    next: z.number().int().positive().nullable(),
    previous: z.number().int().positive().nullable(),
  })
  .strict();

export const companyStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export const companyQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(50).optional(),
  countryCode: z.string().trim().length(2).optional(),
  city: z.string().trim().max(120).optional(),
  client: z.coerce.boolean().optional(),
  sort: z.enum(['recent', 'oldest', 'name', 'category']).default('recent'),
});
export const companySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    category: z.string(),
    countryCode: z.string(),
    city: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    websiteUrl: z.string().nullable(),
    source: z.string(),
    externalId: z.string().nullable(),
    socialLinks: z.record(z.string(), z.string()).nullable(),
    logoUrl: z.string().nullable(),
    imageUrls: z.array(z.string()).nullable(),
    status: companyStatusSchema,
    isClient: z.boolean(),
    prospectCount: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const companyListResponseSchema = z
  .object({
    companies: z.array(companySchema),
    pagination: paginationMetaSchema,
  })
  .strict();
export const updateCompanyRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    websiteUrl: z.url().nullable().optional(),
    email: z.email().nullable().optional(),
    phone: z.string().trim().min(4).max(80).nullable().optional(),
    status: companyStatusSchema.optional(),
  })
  .strict();
export const companyDetailSchema = companySchema.extend({
  prospectIds: z.array(z.uuid()),
  websiteIds: z.array(z.uuid()),
  clientId: z.uuid().nullable(),
  proposalIds: z.array(z.uuid()),
  conversationIds: z.array(z.uuid()),
  projectIds: z.array(z.uuid()),
});

export const prospectQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(50).optional(),
  countryCode: z.string().trim().length(2).optional(),
  city: z.string().trim().max(120).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  status: prospectStatusSchema.optional(),
  websiteQuality: z.enum(['absent', 'weak', 'medium', 'good']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z
    .enum(['score_desc', 'score_asc', 'recent', 'oldest', 'name', 'category'])
    .default('score_desc'),
});
export const prospectListItemSchema = z
  .object({
    id: z.uuid(),
    companyId: z.uuid(),
    companyName: z.string(),
    category: z.string(),
    city: z.string(),
    countryCode: z.string(),
    opportunityScore: z.number().int().nullable(),
    websiteQuality: z.number().int().nullable(),
    hasWebsite: z.boolean(),
    status: prospectStatusSchema,
    lastAnalyzedAt: z.iso.datetime().nullable(),
    discoveredAt: z.iso.datetime(),
    nextAction: z.string().nullable(),
  })
  .strict();
export const paginatedProspectListSchema = z
  .object({
    prospects: z.array(prospectListItemSchema),
    pagination: paginationMetaSchema,
  })
  .strict();

export const agentNameSchema = z.enum([
  'Research',
  'Analysis',
  'Content',
  'Generation',
  'Design Critic',
  'SEO',
  'QA',
  'Deployment',
  'Foundation',
]);
export const agentOperationalStatusSchema = z.enum([
  'IDLE',
  'RUNNING',
  'DEGRADED',
  'ERROR',
  'DISABLED',
]);
export const operationsJobSchema = z
  .object({
    id: z.uuid(),
    agent: agentNameSchema,
    queue: z.string().nullable(),
    type: z.string(),
    entityType: z.string().nullable(),
    entityId: z.uuid().nullable(),
    status: agentJobStatusSchema,
    priority: z.number().int(),
    durationMs: z.number().int().nonnegative().nullable(),
    retries: z.number().int().nonnegative(),
    maxRetries: z.number().int().positive(),
    costMicros: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();
export const operationsJobListSchema = z
  .object({
    jobs: z.array(operationsJobSchema),
    pagination: paginationMetaSchema,
  })
  .strict();
export const jobLogSchema = z
  .object({
    id: z.uuid(),
    timestamp: z.iso.datetime(),
    level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']),
    agent: z.string(),
    message: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
  })
  .strict();
export const operationsJobDetailSchema = operationsJobSchema.extend({
  correlationId: z.uuid().nullable(),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  logs: z.array(jobLogSchema),
});

export const dashboardPeriodSchema = z.enum(['today', '7d', '30d', '90d']);
export const dashboardQuerySchema = z
  .object({ period: dashboardPeriodSchema.default('30d') })
  .strict();
const metricSchema = z
  .object({ value: z.number(), label: z.string() })
  .strict();
export const dashboardOverviewSchema = z
  .object({
    period: dashboardPeriodSchema,
    kpis: z.record(z.string(), metricSchema),
    funnel: z.array(
      z
        .object({
          key: z.string(),
          label: z.string(),
          count: z.number().int().nonnegative(),
          conversion: z.number().min(0).max(100).nullable(),
        })
        .strict(),
    ),
    agents: z.array(
      z
        .object({
          agent: agentNameSchema,
          status: agentOperationalStatusSchema,
          pending: z.number().int().nonnegative(),
          running: z.number().int().nonnegative(),
          failed: z.number().int().nonnegative(),
          lastRunAt: z.iso.datetime().nullable(),
          averageDurationMs: z.number().int().nonnegative().nullable(),
        })
        .strict(),
    ),
    recentJobs: z.array(operationsJobSchema),
    alerts: z.array(
      z
        .object({
          severity: z.enum(['INFO', 'WARNING', 'ERROR']),
          message: z.string(),
          href: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const analyticsSchema = dashboardOverviewSchema.extend({
  ai: z
    .object({
      calls: z.number().int().nonnegative(),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      totalCostMicros: z.number().int().nonnegative(),
      averageDurationMs: z.number().int().nonnegative(),
    })
    .strict(),
  websites: z
    .object({
      averageDesignScore: z.number().nullable(),
      averageSeoScore: z.number().nullable(),
      averageQaScore: z.number().nullable(),
      versions: z.number().int().nonnegative(),
      approvalRate: z.number().min(0).max(100),
    })
    .strict(),
});

export const templateSchema = z
  .object({
    id: z.uuid(),
    key: z.string(),
    name: z.string(),
    category: z.string(),
    version: z.number().int().positive(),
    status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']),
    sections: z.array(z.string()),
    usage: z.number().int().nonnegative(),
    averageDesignScore: z.number().nullable(),
    approvalRate: z.number().min(0).max(100),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const templateListSchema = z
  .object({ templates: z.array(templateSchema) })
  .strict();
export const templateDetailSchema = templateSchema.extend({
  designTokens: z.record(z.string(), z.unknown()),
  websiteIds: z.array(z.uuid()),
});

export const SETTINGS_SECTIONS = [
  'AI',
  'Agents',
  'Websites',
  'Communication',
  'Storage',
  'Deployment',
  'Security',
  'Business',
] as const;
export const settingSchema = z
  .object({
    key: z.string().min(1).max(120),
    section: z.enum(SETTINGS_SECTIONS),
    value: z.union([z.string(), z.number(), z.boolean()]),
    sensitive: z.boolean(),
  })
  .strict();
export const settingsResponseSchema = z
  .object({ settings: z.array(settingSchema) })
  .strict();
export const updateSettingsRequestSchema = z
  .object({
    settings: z.array(settingSchema.omit({ sensitive: true })).max(100),
  })
  .strict();

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CompanyQuery = z.infer<typeof companyQuerySchema>;
export type Company = z.infer<typeof companySchema>;
export type CompanyListResponse = z.infer<typeof companyListResponseSchema>;
export type CompanyDetail = z.infer<typeof companyDetailSchema>;
export type UpdateCompanyRequest = z.infer<typeof updateCompanyRequestSchema>;
export type ProspectQuery = z.infer<typeof prospectQuerySchema>;
export type PaginatedProspectList = z.infer<typeof paginatedProspectListSchema>;
export type OperationsJob = z.infer<typeof operationsJobSchema>;
export type OperationsJobList = z.infer<typeof operationsJobListSchema>;
export type OperationsJobDetail = z.infer<typeof operationsJobDetailSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type Analytics = z.infer<typeof analyticsSchema>;
export type TemplateList = z.infer<typeof templateListSchema>;
export type TemplateDetail = z.infer<typeof templateDetailSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>;
