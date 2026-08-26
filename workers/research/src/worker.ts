import type {
  AgentJobRepository,
  ProspectRepository,
} from '@ai-web-agency/database';
import type { BusinessSearchProvider } from '@ai-web-agency/prospects';
import {
  createRedisConnection,
  getRedisUrl,
  PROSPECT_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type {
  ProspectSearchJobPayload,
  ProspectSearchJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';
import { createResearchProcessor } from './processor.js';
export function createResearchWorker(
  repositories: {
    agentJobs: AgentJobRepository;
    prospects: ProspectRepository;
  },
  provider: BusinessSearchProvider,
  options?: { redisUrl?: string },
) {
  return new Worker<ProspectSearchJobPayload, ProspectSearchJobResult>(
    PROSPECT_QUEUE_NAME,
    createResearchProcessor(repositories, provider),
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      concurrency: 2,
    },
  );
}
