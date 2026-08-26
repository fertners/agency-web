import type { AgentJobRepository } from '@ai-web-agency/database';
import {
  createRedisConnection,
  getRedisUrl,
  ORCHESTRATION_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type {
  ProspectWorkflowJobPayload,
  ProspectWorkflowJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';

import { createProspectWorkflowProcessor } from './processor.js';

export function createOrchestrationWorker(
  repository: AgentJobRepository,
  options: {
    apiBaseUrl: string;
    queueName?: string;
    redisUrl?: string;
    apiToken?: string;
  },
) {
  return new Worker<ProspectWorkflowJobPayload, ProspectWorkflowJobResult>(
    options.queueName ?? ORCHESTRATION_QUEUE_NAME,
    createProspectWorkflowProcessor(repository, options),
    {
      connection: createRedisConnection(options.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
