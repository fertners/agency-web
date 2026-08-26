import type {
  AgentJobRepository,
  DeliveryRepository,
} from '@ai-web-agency/database';
import {
  createRedisConnection,
  DEPLOYMENT_QUEUE_NAME,
  getRedisUrl,
} from '@ai-web-agency/queue';
import type {
  DeploymentJobPayload,
  DeploymentJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';
import { createDeploymentProcessor } from './processor.js';
import type { DeploymentService } from './provider.js';

export function createDeploymentWorker(
  repositories: { agentJobs: AgentJobRepository; delivery: DeliveryRepository },
  provider: DeploymentService,
  options?: { redisUrl?: string },
) {
  return new Worker<DeploymentJobPayload, DeploymentJobResult>(
    DEPLOYMENT_QUEUE_NAME,
    createDeploymentProcessor(repositories, provider),
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
