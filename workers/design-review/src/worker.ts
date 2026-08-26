import type { AIClient } from '@ai-web-agency/ai';
import type { PlaywrightWebsiteReviewer } from '@ai-web-agency/browser';
import type {
  AgentJobRepository,
  DesignReviewRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import {
  createRedisConnection,
  DESIGN_REVIEW_QUEUE_NAME,
  getRedisUrl,
} from '@ai-web-agency/queue';
import type {
  DesignReviewJobPayload,
  DesignReviewJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';
import { createDesignReviewProcessor } from './processor.js';

export function createDesignReviewWorker(
  repositories: {
    agentJobs: AgentJobRepository;
    websites: WebsiteRepository;
    designReviews: DesignReviewRepository;
  },
  ai: AIClient,
  browser: PlaywrightWebsiteReviewer,
  options: {
    previewBaseUrl: string;
    artifactsRoot: string;
    queueName?: string;
    redisUrl?: string;
  },
) {
  return new Worker<DesignReviewJobPayload, DesignReviewJobResult>(
    options.queueName ?? DESIGN_REVIEW_QUEUE_NAME,
    createDesignReviewProcessor(repositories, ai, browser, options),
    {
      connection: createRedisConnection(options.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
