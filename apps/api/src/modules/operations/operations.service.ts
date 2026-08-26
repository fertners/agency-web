import {
  agentFromJobType,
  type AICall,
  type AgentJob,
} from '@ai-web-agency/database';
import {
  analyticsSchema,
  companyDetailSchema,
  companyListResponseSchema,
  dashboardOverviewSchema,
  operationsJobDetailSchema,
  operationsJobListSchema,
  paginatedProspectListSchema,
  settingsResponseSchema,
  templateListSchema,
  templateDetailSchema,
  type Analytics,
  type CompanyDetail,
  type CompanyListResponse,
  type CompanyQuery,
  type DashboardOverview,
  type DashboardQuery,
  type OperationsJob,
  type OperationsJobDetail,
  type OperationsJobList,
  type PaginatedProspectList,
  type PaginationQuery,
  type ProspectQuery,
  type SettingsResponse,
  type TemplateList,
  type TemplateDetail,
  type UpdateCompanyRequest,
  type UpdateSettingsRequest,
} from '@ai-web-agency/shared';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';

import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { AgentJobQueueControlService } from '../../infrastructure/queue/agent-job-queue-control.service.js';

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

const SETTING_VALUE_SCHEMAS: Readonly<Record<string, z.ZodType>> = {
  'ai.defaultProvider': z.string().trim().min(1).max(80),
  'ai.model': z.string().trim().min(1).max(120),
  'ai.maxIterations': z.number().int().min(1).max(10),
  'ai.maxJobBudget': z.number().min(0).max(1_000),
  'agents.maxRetries': z.number().int().min(0).max(10),
  'agents.humanReviewRequired': z.boolean(),
  'websites.minDesignScore': z.number().int().min(0).max(100),
  'websites.minSeoScore': z.number().int().min(0).max(100),
  'websites.minQaScore': z.number().int().min(0).max(100),
  'communication.humanApproval': z.boolean(),
  'deployment.defaultEnvironment': z.enum(['PREVIEW', 'PRODUCTION']),
  'security.auditLogs': z.boolean(),
  'business.currency': z.string().regex(/^[A-Z]{3}$/),
};

function companyResponse(
  company: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    countryCode: string;
    city: string;
    street: string | null;
    postalCode: string | null;
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    source: string;
    externalId: string | null;
    socialLinks: Record<string, string> | null;
    logoUrl: string | null;
    imageUrls: string[] | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  isClient: boolean,
  prospectCount: number,
) {
  return {
    id: company.id,
    name: company.name,
    description: company.description,
    category: company.category,
    countryCode: company.countryCode,
    city: company.city,
    address:
      [company.street, company.postalCode, company.city]
        .filter(Boolean)
        .join(', ') || null,
    phone: company.phone,
    email: company.email,
    websiteUrl: company.websiteUrl,
    source: company.source,
    externalId: company.externalId,
    socialLinks: company.socialLinks,
    logoUrl: company.logoUrl,
    imageUrls: company.imageUrls,
    status: company.archivedAt ? ('ARCHIVED' as const) : ('ACTIVE' as const),
    isClient,
    prospectCount,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}

function toJob(job: AgentJob, calls: AICall[]): OperationsJob {
  const relatedCalls = calls.filter((call) => call.jobId === job.id);
  const durationMs =
    job.startedAt && job.completedAt
      ? Math.max(0, job.completedAt.getTime() - job.startedAt.getTime())
      : null;
  return {
    id: job.id,
    agent: agentFromJobType(job.type),
    queue: job.queueName,
    type: job.type,
    entityType: job.entityType,
    entityId: job.entityId,
    status: job.status,
    priority: job.priority,
    durationMs,
    retries: Math.max(0, job.attempt - 1),
    maxRetries: job.maxAttempts,
    costMicros: relatedCalls.reduce(
      (sum, call) => sum + (call.costMicros ?? 0),
      0,
    ),
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class OperationsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AgentJobQueueControlService)
    private readonly queueControl: AgentJobQueueControlService,
  ) {}

  async companies(query: CompanyQuery): Promise<CompanyListResponse> {
    const result = await this.database.operations.listCompanies(query);
    return companyListResponseSchema.parse({
      companies: result.rows.map(({ company, isClient, prospectCount }) =>
        companyResponse(company, isClient, prospectCount),
      ),
      pagination: result.pagination,
    });
  }

  async company(id: string): Promise<CompanyDetail> {
    const result = await this.database.operations.getCompany(id);
    if (!result) throw new NotFoundException('Company not found');
    return companyDetailSchema.parse({
      ...companyResponse(
        result.company,
        result.clientId !== null,
        result.prospectIds.length,
      ),
      prospectIds: result.prospectIds,
      websiteIds: result.websiteIds,
      clientId: result.clientId,
      proposalIds: result.proposalIds,
      conversationIds: result.conversationIds,
      projectIds: result.projectIds,
    });
  }

  async updateCompany(
    id: string,
    request: UpdateCompanyRequest,
  ): Promise<CompanyDetail> {
    if (!(await this.database.operations.updateCompany(id, request)))
      throw new NotFoundException('Company not found');
    return this.company(id);
  }

  async prospects(query: ProspectQuery): Promise<PaginatedProspectList> {
    const result = await this.database.operations.listProspects(query);
    return paginatedProspectListSchema.parse({
      prospects: result.rows.map(({ prospect, company, websiteQuality }) => ({
        id: prospect.id,
        companyId: company.id,
        companyName: company.name,
        category: company.category,
        city: company.city,
        countryCode: company.countryCode,
        opportunityScore: prospect.opportunityScore,
        websiteQuality,
        hasWebsite: company.websiteUrl !== null,
        status: prospect.status,
        lastAnalyzedAt: prospect.lastAnalyzedAt?.toISOString() ?? null,
        discoveredAt: prospect.createdAt.toISOString(),
        nextAction: prospect.nextAction,
      })),
      pagination: result.pagination,
    });
  }

  async jobs(query: PaginationQuery): Promise<OperationsJobList> {
    const result = await this.database.operations.listJobs(
      query.page,
      query.limit,
    );
    return operationsJobListSchema.parse({
      jobs: result.jobs.map((job) => toJob(job, result.calls)),
      pagination: result.pagination,
    });
  }

  async job(id: string): Promise<OperationsJobDetail> {
    const result = await this.database.operations.getJob(id);
    if (!result) throw new NotFoundException('Agent job not found');
    const summary = toJob(result.job, result.calls);
    return operationsJobDetailSchema.parse({
      ...summary,
      correlationId: result.job.correlationId,
      input: result.job.input,
      output: result.job.output,
      error: result.job.error,
      provider: result.calls.at(-1)?.provider ?? null,
      model: result.calls.at(-1)?.model ?? null,
      inputTokens: result.calls.reduce(
        (sum, call) => sum + (call.inputTokens ?? 0),
        0,
      ),
      outputTokens: result.calls.reduce(
        (sum, call) => sum + (call.outputTokens ?? 0),
        0,
      ),
      logs: result.logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        level: log.level,
        agent: log.agent,
        message: log.message,
        metadata: log.metadata,
      })),
    });
  }

  async retryJob(id: string): Promise<OperationsJobDetail> {
    const job = await this.database.agentJobs.findById(id);
    if (job === undefined) throw new NotFoundException('Agent job not found');
    if (job.status !== 'FAILED')
      throw new BadRequestException('Only failed jobs can be retried');
    if (job.attempt >= job.maxAttempts)
      throw new BadRequestException('Maximum retries reached');
    if (job.queueName === null || job.queueJobId === null)
      throw new BadRequestException('Job has no queue identity');
    try {
      await this.queueControl.retry(job.queueName, job.queueJobId);
      await this.database.agentJobs.markRetryRequested(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to retry job',
      );
    }
    return this.job(id);
  }

  async cancelJob(id: string): Promise<OperationsJobDetail> {
    const job = await this.database.agentJobs.findById(id);
    if (job === undefined) throw new NotFoundException('Agent job not found');
    if (job.status !== 'PENDING')
      throw new BadRequestException('Only pending jobs can be cancelled');
    if (job.queueName === null || job.queueJobId === null)
      throw new BadRequestException('Job has no queue identity');
    try {
      await this.queueControl.cancel(job.queueName, job.queueJobId);
      await this.database.agentJobs.markCancelled(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to cancel job',
      );
    }
    return this.job(id);
  }

  async templates(): Promise<TemplateList> {
    const rows = await this.database.operations.listTemplates();
    return templateListSchema.parse({
      templates: rows.map(({ template, usage }) => ({
        id: template.id,
        key: template.key,
        name: template.name,
        category: template.category,
        version: template.version,
        status: template.status,
        sections: template.sections,
        usage,
        averageDesignScore: null,
        approvalRate: 0,
        createdAt: template.createdAt.toISOString(),
      })),
    });
  }

  async template(id: string): Promise<TemplateDetail> {
    const result = await this.database.operations.getTemplate(id);
    if (!result) throw new NotFoundException('Template not found');
    const { template, websiteIds } = result;
    return templateDetailSchema.parse({
      id: template.id,
      key: template.key,
      name: template.name,
      category: template.category,
      version: template.version,
      status: template.status,
      sections: template.sections,
      designTokens: template.designTokens,
      usage: websiteIds.length,
      averageDesignScore: null,
      approvalRate: 0,
      websiteIds,
      createdAt: template.createdAt.toISOString(),
    });
  }

  async overview(query: DashboardQuery): Promise<DashboardOverview> {
    const data = await this.database.operations.overview(query);
    const qualifiedStatuses = new Set([
      'QUALIFIED',
      'PREVIEW_GENERATED',
      'CONTACT_READY',
      'CONTACTED',
      'REPLIED',
      'RESPONDED',
      'INTERESTED',
      'PROPOSAL_SENT',
      'WON',
      'CONVERTED',
    ]);
    const contacts = data.prospects.filter((row) =>
      [
        'CONTACTED',
        'REPLIED',
        'RESPONDED',
        'INTERESTED',
        'PROPOSAL_SENT',
        'WON',
        'CONVERTED',
      ].includes(row.status),
    ).length;
    const replies = data.prospects.filter((row) =>
      [
        'REPLIED',
        'RESPONDED',
        'INTERESTED',
        'PROPOSAL_SENT',
        'WON',
        'CONVERTED',
      ].includes(row.status),
    ).length;
    const live = data.deployments.filter(
      (row) => row.environment === 'PRODUCTION' && row.status === 'COMPLETED',
    ).length;
    const analyzed = data.prospects.filter(
      (row) => row.lastAnalyzedAt !== null,
    ).length;
    const qualified = data.prospects.filter((row) =>
      qualifiedStatuses.has(row.status),
    ).length;
    const preview = data.websites.length;
    const totalCostMicros = data.calls.reduce(
      (sum, call) => sum + (call.costMicros ?? 0),
      0,
    );
    const funnelCounts = [
      ['companies', 'Entreprises trouvées', data.companies.length],
      ['analyzed', 'Entreprises analysées', analyzed],
      ['qualified', 'Opportunités qualifiées', qualified],
      ['previews', 'Previews générées', preview],
      ['contacts', 'Contacts', contacts],
      ['replies', 'Réponses', replies],
      ['proposals', 'Propositions', data.proposals.length],
      ['clients', 'Clients', data.clients.length],
    ] as const;
    const allAgents = [
      'Research',
      'Analysis',
      'Content',
      'Generation',
      'Design Critic',
      'SEO',
      'QA',
      'Deployment',
    ] as const;
    const agents = allAgents.map((agent) => {
      const jobs = data.jobs.filter(
        (job) => agentFromJobType(job.type) === agent,
      );
      const running = jobs.filter((job) => job.status === 'RUNNING').length;
      const failed = jobs.filter((job) => job.status === 'FAILED').length;
      const durations = jobs
        .filter((job) => job.startedAt && job.completedAt)
        .map((job) =>
          Math.max(
            0,
            (job.completedAt as Date).getTime() -
              (job.startedAt as Date).getTime(),
          ),
        );
      return {
        agent,
        status:
          failed > 0
            ? ('DEGRADED' as const)
            : running > 0
              ? ('RUNNING' as const)
              : ('IDLE' as const),
        pending: jobs.filter((job) => job.status === 'PENDING').length,
        running,
        failed,
        lastRunAt:
          [...jobs]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
            ?.updatedAt.toISOString() ?? null,
        averageDurationMs: average(durations),
      };
    });
    const recentJobs = [...data.jobs]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((job) => toJob(job, data.calls));
    const failedJobs = data.jobs.filter(
      (job) => job.status === 'FAILED',
    ).length;
    const alerts = [
      ...(failedJobs
        ? [
            {
              severity: 'ERROR' as const,
              message: `${failedJobs} job(s) en échec.`,
              href: '/jobs?status=FAILED',
            },
          ]
        : []),
      ...(data.prospects.filter((row) => row.status === 'REVIEW_REQUIRED')
        .length
        ? [
            {
              severity: 'WARNING' as const,
              message: 'Des prospects nécessitent une review.',
              href: '/prospects?status=REVIEW_REQUIRED',
            },
          ]
        : []),
    ];
    return dashboardOverviewSchema.parse({
      period: query.period,
      kpis: {
        prospectsFound: {
          label: 'Prospects trouvés',
          value: data.prospects.length,
        },
        analyzed: { label: 'Prospects analysés', value: analyzed },
        qualified: { label: 'Opportunités qualifiées', value: qualified },
        previews: { label: 'Previews générées', value: preview },
        contacts: { label: 'Contacts effectués', value: contacts },
        replies: { label: 'Réponses', value: replies },
        clients: { label: 'Clients', value: data.clients.length },
        live: { label: 'Sites live', value: live },
        aiCost: {
          label: 'Coût IA total (€)',
          value: totalCostMicros / 1_000_000,
        },
        averageWebsiteCost: {
          label: 'Coût IA moyen/site (€)',
          value: preview ? totalCostMicros / 1_000_000 / preview : 0,
        },
        runningJobs: {
          label: 'Jobs en cours',
          value: data.jobs.filter((job) => job.status === 'RUNNING').length,
        },
        failedJobs: { label: 'Jobs échoués', value: failedJobs },
      },
      funnel: funnelCounts.map(([key, label, count], index) => ({
        key,
        label,
        count,
        conversion:
          index === 0 || funnelCounts[index - 1]?.[2] === 0
            ? null
            : Math.min(
                100,
                Math.round((count / (funnelCounts[index - 1]?.[2] ?? 1)) * 100),
              ),
      })),
      agents,
      recentJobs,
      alerts,
    });
  }

  async analytics(query: DashboardQuery): Promise<Analytics> {
    const [overview, data, quality] = await Promise.all([
      this.overview(query),
      this.database.operations.overview(query),
      this.database.operations.analyticsQuality(),
    ]);
    const calls = data.calls;
    const designScores = quality.reviews.flatMap((row) =>
      row.result ? [row.result.score] : [],
    );
    const seoScores = quality.reports.flatMap((row) =>
      row.report ? [row.report.seo.score] : [],
    );
    const qaScores = quality.reports.flatMap((row) =>
      row.report ? [row.report.score] : [],
    );
    const approved = quality.versions.filter(
      (row) => row.status === 'APPROVED',
    ).length;
    return analyticsSchema.parse({
      ...overview,
      ai: {
        calls: calls.length,
        inputTokens: calls.reduce(
          (sum, call) => sum + (call.inputTokens ?? 0),
          0,
        ),
        outputTokens: calls.reduce(
          (sum, call) => sum + (call.outputTokens ?? 0),
          0,
        ),
        totalCostMicros: calls.reduce(
          (sum, call) => sum + (call.costMicros ?? 0),
          0,
        ),
        averageDurationMs: average(calls.map((call) => call.durationMs)) ?? 0,
      },
      websites: {
        averageDesignScore: average(designScores),
        averageSeoScore: average(seoScores),
        averageQaScore: average(qaScores),
        versions: quality.versions.length,
        approvalRate: quality.versions.length
          ? Math.round((approved / quality.versions.length) * 100)
          : 0,
      },
    });
  }

  async settings(): Promise<SettingsResponse> {
    const rows = await this.database.operations.listSettings();
    return settingsResponseSchema.parse({
      settings: rows.map((row) => ({
        key: row.key,
        section: row.section,
        value: row.value,
        sensitive: row.isSensitive,
      })),
    });
  }

  async updateSettings(
    request: UpdateSettingsRequest,
  ): Promise<SettingsResponse> {
    for (const setting of request.settings) {
      const schema = SETTING_VALUE_SCHEMAS[setting.key];
      if (schema && !schema.safeParse(setting.value).success) {
        throw new BadRequestException(`Invalid value for ${setting.key}`);
      }
    }
    await this.database.operations.updateSettings(request);
    return this.settings();
  }
}
