import type {
  ProspectSearchJobPayload,
  ProspectSearchJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';
import { createRedisConnection, getRedisUrl } from './connection.js';
export const PROSPECT_QUEUE_NAME = 'prospect-research';
export const PROSPECT_SEARCH_JOB_NAME = 'search-businesses';
export const PROSPECT_JOB_ATTEMPTS = 3;
export const PROSPECT_JOB_OPTIONS = {
  attempts: PROSPECT_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;
export function createProspectQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<ProspectSearchJobPayload, ProspectSearchJobResult>(
    options?.queueName ?? PROSPECT_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: PROSPECT_JOB_OPTIONS,
    },
  );
}
export type ProspectQueue = ReturnType<typeof createProspectQueue>;
