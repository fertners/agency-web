import type { DiagnosticJobPayload } from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';

import { createRedisConnection, getRedisUrl } from './connection.js';

export const FOUNDATION_QUEUE_NAME = 'foundation';
export const DIAGNOSTIC_JOB_NAME = 'diagnostic';
export const DIAGNOSTIC_JOB_ATTEMPTS = 3;

export type DiagnosticJobResult = Readonly<{
  processedAt: string;
  worker: 'foundation';
}>;

export const DIAGNOSTIC_JOB_OPTIONS = {
  attempts: DIAGNOSTIC_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 500 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;

export function createFoundationQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<DiagnosticJobPayload, DiagnosticJobResult>(
    options?.queueName ?? FOUNDATION_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: DIAGNOSTIC_JOB_OPTIONS,
    },
  );
}

export type FoundationQueue = ReturnType<typeof createFoundationQueue>;
