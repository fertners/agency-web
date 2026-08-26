import {
  createProspectQueue,
  PROSPECT_QUEUE_NAME,
  PROSPECT_SEARCH_JOB_NAME,
} from '@ai-web-agency/queue';
import type { ProspectSearchJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
@Injectable()
export class ProspectQueueService implements OnApplicationShutdown {
  private readonly queue = createProspectQueue();
  async add(jobId: string, payload: ProspectSearchJobPayload): Promise<string> {
    const job = await this.queue.add(PROSPECT_SEARCH_JOB_NAME, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }
  get name(): string {
    return PROSPECT_QUEUE_NAME;
  }
  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
