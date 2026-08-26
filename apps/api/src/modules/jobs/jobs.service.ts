import type { AgentJob } from '@ai-web-agency/database';
import {
  agentJobResponseSchema,
  agentJobListResponseSchema,
  createDiagnosticJobResponseSchema,
  diagnosticJobPayloadSchema,
  type AgentJobResponse,
  type AgentJobListResponse,
  type CreateDiagnosticJobRequest,
  type CreateDiagnosticJobResponse,
} from '@ai-web-agency/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { FoundationQueueService } from '../../infrastructure/queue/foundation-queue.service.js';

@Injectable()
export class JobsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(FoundationQueueService)
    private readonly foundationQueue: FoundationQueueService,
  ) {}

  async createDiagnostic(
    request: CreateDiagnosticJobRequest,
  ): Promise<CreateDiagnosticJobResponse> {
    const payload = diagnosticJobPayloadSchema.parse({
      requestedAt: new Date().toISOString(),
      ...(request.correlationId === undefined
        ? {}
        : { correlationId: request.correlationId }),
    });
    const job = await this.database.agentJobs.create(payload);

    try {
      const queuedJobId = await this.foundationQueue.addDiagnostic(
        job.id,
        payload,
      );
      await this.database.agentJobs.markQueued(
        job.id,
        this.foundationQueue.name,
        queuedJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(job.id, 0);
      throw new Error('Unable to enqueue diagnostic job');
    }

    return createDiagnosticJobResponseSchema.parse({
      jobId: job.id,
      status: 'PENDING',
    });
  }

  async findById(id: string): Promise<AgentJobResponse> {
    const job = await this.database.agentJobs.findById(id);
    if (job === undefined) {
      throw new NotFoundException('Agent job not found');
    }

    return this.toResponse(job);
  }

  async listRecent(): Promise<AgentJobListResponse> {
    const jobs = await this.database.agentJobs.listRecent();
    return agentJobListResponseSchema.parse({
      jobs: jobs.map((job) => this.toResponse(job)),
    });
  }

  private toResponse(job: AgentJob): AgentJobResponse {
    return agentJobResponseSchema.parse({
      jobId: job.id,
      type: job.type,
      status: job.status,
      attempt: job.attempt,
      output: job.output,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    });
  }
}
