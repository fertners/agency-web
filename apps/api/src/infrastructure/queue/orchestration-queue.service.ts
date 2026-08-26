import {
  createOrchestrationQueue,
  ORCHESTRATION_QUEUE_NAME,
  PROSPECT_WORKFLOW_JOB_NAME,
} from '@ai-web-agency/queue';
import type { ProspectWorkflowJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class OrchestrationQueueService implements OnApplicationShutdown {
  private readonly queue = createOrchestrationQueue();

  async add(jobId: string, payload: ProspectWorkflowJobPayload) {
    const job = await this.queue.add(PROSPECT_WORKFLOW_JOB_NAME, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }

  get name(): string {
    return ORCHESTRATION_QUEUE_NAME;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
