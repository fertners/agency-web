import type {
  DeploymentJobPayload,
  DeploymentJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';
import { createRedisConnection, getRedisUrl } from './connection.js';

export const DEPLOYMENT_QUEUE_NAME = 'deployment';
export const DEPLOYMENT_JOB_NAME = 'deploy-local-preview';
export const DEPLOYMENT_JOB_ATTEMPTS = 2;
export const DEPLOYMENT_JOB_OPTIONS = {
  attempts: DEPLOYMENT_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;

export function createDeploymentQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<DeploymentJobPayload, DeploymentJobResult>(
    options?.queueName ?? DEPLOYMENT_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: DEPLOYMENT_JOB_OPTIONS,
    },
  );
}
export type DeploymentQueue = ReturnType<typeof createDeploymentQueue>;
