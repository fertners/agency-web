import {
  createQualityQueue,
  QUALITY_JOB_NAME,
  QUALITY_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type { QualityJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
@Injectable()
export class QualityQueueService implements OnApplicationShutdown {
  private readonly queue = createQualityQueue();
  async add(jobId: string, payload: QualityJobPayload): Promise<string> {
    const job = await this.queue.add(QUALITY_JOB_NAME, payload, { jobId });
    return job.id ?? jobId;
  }
  get name(): string {
    return QUALITY_QUEUE_NAME;
  }
  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
