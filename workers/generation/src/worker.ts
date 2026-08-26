import type { AIClient } from '@ai-web-agency/ai';
import type {
  AgentJobRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import {
  createRedisConnection,
  GENERATION_QUEUE_NAME,
  getRedisUrl,
} from '@ai-web-agency/queue';
import type {
  GenerationJobPayload,
  GenerationJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';

import { createGenerationProcessor } from './processor.js';

export function createGenerationWorker(
  repositories: {
    agentJobs: AgentJobRepository;
    websites: WebsiteRepository;
  },
  ai: AIClient,
  options?: { queueName?: string; redisUrl?: string },
) {
  return new Worker<GenerationJobPayload, GenerationJobResult>(
    options?.queueName ?? GENERATION_QUEUE_NAME,
    createGenerationProcessor(repositories, ai),
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
