import {
  createDesignReviewQueue,
  DESIGN_REVIEW_JOB_NAME,
  DESIGN_REVIEW_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type { DesignReviewJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class DesignReviewQueueService implements OnApplicationShutdown {
  private readonly queue = createDesignReviewQueue();
  async add(jobId: string, payload: DesignReviewJobPayload): Promise<string> {
    const job = await this.queue.add(DESIGN_REVIEW_JOB_NAME, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }
  get name(): string {
    return DESIGN_REVIEW_QUEUE_NAME;
  }
  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
