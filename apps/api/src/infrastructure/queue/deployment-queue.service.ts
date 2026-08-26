import {
  createDeploymentQueue,
  DEPLOYMENT_JOB_NAME,
  DEPLOYMENT_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type { DeploymentJobPayload } from '@ai-web-agency/shared';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class DeploymentQueueService implements OnApplicationShutdown {
  private readonly queue = createDeploymentQueue();
  async add(jobId: string, payload: DeploymentJobPayload) {
    const job = await this.queue.add(DEPLOYMENT_JOB_NAME, payload, { jobId });
    return job.id ?? jobId;
  }
  get name() {
    return DEPLOYMENT_QUEUE_NAME;
  }
  async onApplicationShutdown() {
    await this.queue.close();
  }
}
