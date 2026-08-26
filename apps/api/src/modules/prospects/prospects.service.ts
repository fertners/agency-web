import {
  createProspectSearchResponseSchema,
  prospectListResponseSchema,
  prospectSearchJobPayloadSchema,
  type CreateProspectSearchResponse,
  type ProspectListResponse,
  type ProspectSearchRequest,
} from '@ai-web-agency/shared';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { ProspectQueueService } from '../../infrastructure/queue/prospect-queue.service.js';
@Injectable()
export class ProspectsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ProspectQueueService) private readonly queue: ProspectQueueService,
  ) {}
  async search(
    request: ProspectSearchRequest,
  ): Promise<CreateProspectSearchResponse> {
    const payload = prospectSearchJobPayloadSchema.parse(request);
    const job = await this.database.agentJobs.createTyped(
      'prospect.search',
      payload,
    );
    try {
      const queueJobId = await this.queue.add(job.id, payload);
      await this.database.agentJobs.markQueued(
        job.id,
        this.queue.name,
        queueJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(
        job.id,
        0,
        'Unable to enqueue prospect research',
      );
      throw new Error('Unable to enqueue prospect research');
    }
    return createProspectSearchResponseSchema.parse({
      jobId: job.id,
      status: 'PENDING',
    });
  }
  async list(): Promise<ProspectListResponse> {
    const rows = await this.database.prospects.listRecent();
    return prospectListResponseSchema.parse({
      prospects: rows.map(({ prospect, company }) => ({
        prospectId: prospect.id,
        companyId: company.id,
        name: company.name,
        source: company.source,
        category: company.category,
        city: company.city,
        countryCode: company.countryCode,
        websiteUrl: company.websiteUrl,
        email: company.email,
        phone: company.phone,
        status: prospect.status,
        opportunityScore: prospect.opportunityScore,
        assessment: prospect.assessment,
        updatedAt: prospect.updatedAt.toISOString(),
      })),
    });
  }
}
