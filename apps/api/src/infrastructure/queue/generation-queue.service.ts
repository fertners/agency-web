import {
  createGenerationQueue,
  GENERATE_RESTAURANT_JOB_NAME,
  GENERATION_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type { GenerationJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class GenerationQueueService implements OnApplicationShutdown {
  private readonly queue = createGenerationQueue();

  async addRestaurantGeneration(
    jobId: string,
    payload: GenerationJobPayload,
  ): Promise<string> {
    const job = await this.queue.add(GENERATE_RESTAURANT_JOB_NAME, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }

  get name(): string {
    return GENERATION_QUEUE_NAME;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
