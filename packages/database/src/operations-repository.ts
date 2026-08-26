import type {
  CompanyQuery,
  DashboardQuery,
  ProspectQuery,
  UpdateCompanyRequest,
  UpdateSettingsRequest,
} from '@ai-web-agency/shared';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm';

import type { Database } from './client.js';
import {
  agentJobLogs,
  agentJobs,
  aiCalls,
  appSettings,
  clients,
  companies,
  conversations,
  deployments,
  designReviews,
  projects,
  proposals,
  prospects,
  qualityReports,
  templates,
  websites,
  websiteVersions,
} from './schema/index.js';

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    next: page * limit < total ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
  };
}

export function agentFromJobType(type: string) {
  if (type.startsWith('prospect.')) return 'Research' as const;
  if (type.includes('analysis')) return 'Analysis' as const;
  if (type.includes('design-review')) return 'Design Critic' as const;
  if (type.includes('quality')) return 'QA' as const;
  if (type.includes('seo')) return 'SEO' as const;
  if (type.includes('generate')) return 'Generation' as const;
  if (type.includes('deployment')) return 'Deployment' as const;
  if (type.includes('content')) return 'Content' as const;
  return 'Foundation' as const;
}

export class OperationsRepository {
  constructor(private readonly database: Database) {}

  async listCompanies(query: CompanyQuery) {
    const conditions = [
      query.search
        ? or(
            ilike(companies.name, `%${query.search}%`),
            ilike(companies.city, `%${query.search}%`),
          )
        : undefined,
      query.category ? eq(companies.category, query.category) : undefined,
      query.countryCode
        ? eq(companies.countryCode, query.countryCode.toUpperCase())
        : undefined,
      query.city ? ilike(companies.city, `%${query.city}%`) : undefined,
      query.client === true
        ? sql`exists(select 1 from ${clients} c where c.company_id = ${companies.id})`
        : query.client === false
          ? sql`not exists(select 1 from ${clients} c where c.company_id = ${companies.id})`
          : undefined,
    ].filter((condition) => condition !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const order =
      query.sort === 'oldest'
        ? asc(companies.createdAt)
        : query.sort === 'name'
          ? asc(companies.name)
          : query.sort === 'category'
            ? asc(companies.category)
            : desc(companies.updatedAt);
    const [rows, totalRows] = await Promise.all([
      this.database
        .select({
          company: companies,
          isClient: sql<boolean>`exists(select 1 from ${clients} c where c.company_id = ${companies.id})`,
          prospectCount: sql<number>`(select count(*)::int from ${prospects} p where p.company_id = ${companies.id})`,
        })
        .from(companies)
        .where(where)
        .orderBy(order)
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database.select({ value: count() }).from(companies).where(where),
    ]);
    return {
      rows,
      pagination: pagination(query.page, query.limit, totalRows[0]?.value ?? 0),
    };
  }

  async getCompany(id: string) {
    const [company] = await this.database
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    if (!company) return undefined;
    const [prospectRows, websiteRows, clientRows] = await Promise.all([
      this.database.select().from(prospects).where(eq(prospects.companyId, id)),
      this.database.select().from(websites).where(eq(websites.companyId, id)),
      this.database.select().from(clients).where(eq(clients.companyId, id)),
    ]);
    const prospectIds = prospectRows.map((row) => row.id);
    const clientIds = clientRows.map((row) => row.id);
    const [proposalRows, conversationRows, projectRows] = await Promise.all([
      prospectIds.length
        ? this.database
            .select({ id: proposals.id })
            .from(proposals)
            .where(inArray(proposals.prospectId, prospectIds))
        : [],
      prospectIds.length
        ? this.database
            .select({ id: conversations.id })
            .from(conversations)
            .where(inArray(conversations.prospectId, prospectIds))
        : [],
      clientIds.length
        ? this.database
            .select({ id: projects.id })
            .from(projects)
            .where(inArray(projects.clientId, clientIds))
        : [],
    ]);
    return {
      company,
      prospectIds,
      websiteIds: websiteRows.map((row) => row.id),
      clientId: clientRows[0]?.id ?? null,
      proposalIds: proposalRows.map((row) => row.id),
      conversationIds: conversationRows.map((row) => row.id),
      projectIds: projectRows.map((row) => row.id),
    };
  }

  async updateCompany(id: string, input: UpdateCompanyRequest) {
    const { status, ...fields } = input;
    const [row] = await this.database
      .update(companies)
      .set({
        ...fields,
        archivedAt:
          status === 'ARCHIVED'
            ? new Date()
            : status === 'ACTIVE'
              ? null
              : undefined,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();
    return row;
  }

  async listProspects(query: ProspectQuery) {
    const websiteQuality = sql<number>`coalesce((${prospects.assessment}->'components'->>'websiteQuality')::int, null)`;
    const conditions = [
      query.search ? ilike(companies.name, `%${query.search}%`) : undefined,
      query.category ? eq(companies.category, query.category) : undefined,
      query.countryCode
        ? eq(companies.countryCode, query.countryCode.toUpperCase())
        : undefined,
      query.city ? ilike(companies.city, `%${query.city}%`) : undefined,
      query.minScore !== undefined
        ? gte(prospects.opportunityScore, query.minScore)
        : undefined,
      query.maxScore !== undefined
        ? lte(prospects.opportunityScore, query.maxScore)
        : undefined,
      query.status ? eq(prospects.status, query.status) : undefined,
      query.websiteQuality === 'absent'
        ? sql`${companies.websiteUrl} is null`
        : query.websiteQuality === 'weak'
          ? lte(websiteQuality, 40)
          : query.websiteQuality === 'medium'
            ? and(gte(websiteQuality, 41), lte(websiteQuality, 70))
            : query.websiteQuality === 'good'
              ? gte(websiteQuality, 71)
              : undefined,
      query.from ? gte(prospects.createdAt, query.from) : undefined,
      query.to ? lte(prospects.createdAt, query.to) : undefined,
    ].filter((condition) => condition !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const order =
      query.sort === 'score_asc'
        ? asc(prospects.opportunityScore)
        : query.sort === 'recent'
          ? desc(prospects.createdAt)
          : query.sort === 'oldest'
            ? asc(prospects.createdAt)
            : query.sort === 'name'
              ? asc(companies.name)
              : query.sort === 'category'
                ? asc(companies.category)
                : desc(prospects.opportunityScore);
    const [rows, totalRows] = await Promise.all([
      this.database
        .select({ prospect: prospects, company: companies, websiteQuality })
        .from(prospects)
        .innerJoin(companies, eq(prospects.companyId, companies.id))
        .where(where)
        .orderBy(order)
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database
        .select({ value: count() })
        .from(prospects)
        .innerJoin(companies, eq(prospects.companyId, companies.id))
        .where(where),
    ]);
    return {
      rows,
      pagination: pagination(query.page, query.limit, totalRows[0]?.value ?? 0),
    };
  }

  async listJobs(page = 1, limit = 20) {
    const [jobs, totalRows] = await Promise.all([
      this.database
        .select()
        .from(agentJobs)
        .orderBy(desc(agentJobs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.select({ value: count() }).from(agentJobs),
    ]);
    const ids = jobs.map((job) => job.id);
    const calls = ids.length
      ? await this.database
          .select()
          .from(aiCalls)
          .where(inArray(aiCalls.jobId, ids))
      : [];
    return {
      jobs,
      calls,
      pagination: pagination(page, limit, totalRows[0]?.value ?? 0),
    };
  }

  async getJob(id: string) {
    const [job] = await this.database
      .select()
      .from(agentJobs)
      .where(eq(agentJobs.id, id));
    if (!job) return undefined;
    const [calls, logs] = await Promise.all([
      this.database.select().from(aiCalls).where(eq(aiCalls.jobId, id)),
      this.database
        .select()
        .from(agentJobLogs)
        .where(eq(agentJobLogs.jobId, id))
        .orderBy(asc(agentJobLogs.createdAt)),
    ]);
    return { job, calls, logs };
  }

  async cancelJob(id: string) {
    const [row] = await this.database
      .update(agentJobs)
      .set({
        status: 'CANCELLED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(agentJobs.id, id), eq(agentJobs.status, 'PENDING')))
      .returning();
    return row;
  }

  listTemplates() {
    return this.database
      .select({
        template: templates,
        usage: sql<number>`(select count(*)::int from ${websites} w where w.template_key = ${templates.key})`,
      })
      .from(templates)
      .orderBy(asc(templates.category), desc(templates.version));
  }

  async getTemplate(id: string) {
    const [template] = await this.database
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    if (!template) return undefined;
    const websiteRows = await this.database
      .select({ id: websites.id })
      .from(websites)
      .where(eq(websites.templateKey, template.key));
    return { template, websiteIds: websiteRows.map((row) => row.id) };
  }

  async overview(query: DashboardQuery) {
    const now = new Date();
    const start = new Date(now);
    if (query.period === 'today') start.setHours(0, 0, 0, 0);
    else start.setDate(start.getDate() - Number.parseInt(query.period));
    const [
      companyRows,
      prospectRows,
      websiteRows,
      proposalRows,
      clientRows,
      deploymentRows,
      jobs,
      calls,
    ] = await Promise.all([
      this.database
        .select()
        .from(companies)
        .where(gte(companies.createdAt, start)),
      this.database
        .select()
        .from(prospects)
        .where(gte(prospects.createdAt, start)),
      this.database
        .select()
        .from(websites)
        .where(gte(websites.createdAt, start)),
      this.database
        .select()
        .from(proposals)
        .where(gte(proposals.createdAt, start)),
      this.database.select().from(clients).where(gte(clients.createdAt, start)),
      this.database
        .select()
        .from(deployments)
        .where(gte(deployments.createdAt, start)),
      this.database
        .select()
        .from(agentJobs)
        .where(gte(agentJobs.createdAt, start)),
      this.database.select().from(aiCalls).where(gte(aiCalls.createdAt, start)),
    ]);
    return {
      companies: companyRows,
      prospects: prospectRows,
      websites: websiteRows,
      proposals: proposalRows,
      clients: clientRows,
      deployments: deploymentRows,
      jobs,
      calls,
    };
  }

  async analyticsQuality() {
    const [reviews, reports, versions] = await Promise.all([
      this.database.select().from(designReviews),
      this.database.select().from(qualityReports),
      this.database.select().from(websiteVersions),
    ]);
    return { reviews, reports, versions };
  }

  listSettings() {
    return this.database
      .select()
      .from(appSettings)
      .where(eq(appSettings.isSensitive, false))
      .orderBy(asc(appSettings.section), asc(appSettings.key));
  }

  async updateSettings(input: UpdateSettingsRequest) {
    return this.database.transaction(async (tx) => {
      for (const setting of input.settings) {
        await tx
          .insert(appSettings)
          .values({
            key: setting.key,
            section: setting.section,
            value: setting.value,
            isSensitive: false,
          })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              section: setting.section,
              value: setting.value,
              updatedAt: new Date(),
            },
          });
      }
      return tx
        .select()
        .from(appSettings)
        .where(eq(appSettings.isSensitive, false));
    });
  }
}
