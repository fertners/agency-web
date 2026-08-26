import type {
  ProspectWorkflowJobPayload,
  ProspectWorkflowJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';

import { createRedisConnection, getRedisUrl } from './connection.js';

export const ORCHESTRATION_QUEUE_NAME = 'orchestration';
export const PROSPECT_WORKFLOW_JOB_NAME = 'prepare-prospect-proposal';
export const ORCHESTRATION_JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;

export function createOrchestrationQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<ProspectWorkflowJobPayload, ProspectWorkflowJobResult>(
    options?.queueName ?? ORCHESTRATION_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: ORCHESTRATION_JOB_OPTIONS,
    },
  );
}

export type OrchestrationQueue = ReturnType<typeof createOrchestrationQueue>;
