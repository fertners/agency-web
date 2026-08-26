import type {
  GenerationJobPayload,
  GenerationJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';

import { createRedisConnection, getRedisUrl } from './connection.js';

export const GENERATION_QUEUE_NAME = 'generation';
export const GENERATE_RESTAURANT_JOB_NAME = 'generate-restaurant';
export const GENERATION_JOB_ATTEMPTS = 3;

export const GENERATION_JOB_OPTIONS = {
  attempts: GENERATION_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;

export function createGenerationQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<GenerationJobPayload, GenerationJobResult>(
    options?.queueName ?? GENERATION_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: GENERATION_JOB_OPTIONS,
    },
  );
}

export type GenerationQueue = ReturnType<typeof createGenerationQueue>;
