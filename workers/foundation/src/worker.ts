import type { AgentJobRepository } from '@ai-web-agency/database';
import {
  createRedisConnection,
  FOUNDATION_QUEUE_NAME,
  getRedisUrl,
} from '@ai-web-agency/queue';
import type { DiagnosticJobPayload } from '@ai-web-agency/shared';
import { Worker } from 'bullmq';

import {
  createDiagnosticProcessor,
  type DiagnosticHandler,
} from './processor.js';

export function createFoundationWorker(
  repository: AgentJobRepository,
  options?: {
    handler?: DiagnosticHandler;
    queueName?: string;
    redisUrl?: string;
  },
) {
  return new Worker<DiagnosticJobPayload>(
    options?.queueName ?? FOUNDATION_QUEUE_NAME,
    createDiagnosticProcessor(repository, options?.handler),
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
