import {
  createFoundationQueue,
  DIAGNOSTIC_JOB_NAME,
  FOUNDATION_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type { DiagnosticJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class FoundationQueueService implements OnApplicationShutdown {
  private readonly queue = createFoundationQueue();

  async addDiagnostic(
    jobId: string,
    payload: DiagnosticJobPayload,
  ): Promise<string> {
    const job = await this.queue.add(DIAGNOSTIC_JOB_NAME, payload, { jobId });
    return job.id ?? jobId;
  }

  get name(): string {
    return FOUNDATION_QUEUE_NAME;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
