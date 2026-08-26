import type {
  DesignReviewJobPayload,
  DesignReviewJobResult,
} from '@ai-web-agency/shared';
import { Queue, type JobsOptions } from 'bullmq';
import { createRedisConnection, getRedisUrl } from './connection.js';

export const DESIGN_REVIEW_QUEUE_NAME = 'design-review';
export const DESIGN_REVIEW_JOB_NAME = 'review-website-design';
export const DESIGN_REVIEW_JOB_ATTEMPTS = 2;
export const DESIGN_REVIEW_JOB_OPTIONS = {
  attempts: DESIGN_REVIEW_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;
export function createDesignReviewQueue(options?: {
  queueName?: string;
  redisUrl?: string;
}) {
  return new Queue<DesignReviewJobPayload, DesignReviewJobResult>(
    options?.queueName ?? DESIGN_REVIEW_QUEUE_NAME,
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      defaultJobOptions: DESIGN_REVIEW_JOB_OPTIONS,
    },
  );
}
export type DesignReviewQueue = ReturnType<typeof createDesignReviewQueue>;
