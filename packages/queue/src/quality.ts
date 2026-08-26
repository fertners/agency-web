import type {
  QualityJobPayload,
  QualityJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';
import { createRedisConnection, getRedisUrl } from './connection.js';
export const QUALITY_QUEUE_NAME = 'quality';
export const QUALITY_JOB_NAME = 'audit-website-quality';
export const QUALITY_JOB_ATTEMPTS = 2;
export const QUALITY_JOB_OPTIONS = {
  attempts: QUALITY_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;
export function createQualityQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<QualityJobPayload, QualityJobResult>(
    options?.queueName ?? QUALITY_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: QUALITY_JOB_OPTIONS,
    },
  );
}
export type QualityQueue = ReturnType<typeof createQualityQueue>;
