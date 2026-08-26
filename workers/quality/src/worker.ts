import type { PlaywrightQualityAuditor } from '@ai-web-agency/browser';
import type {
  AgentJobRepository,
  QualityReportRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import {
  createRedisConnection,
  getRedisUrl,
  QUALITY_QUEUE_NAME,
} from '@ai-web-agency/queue';
import type {
  QualityJobPayload,
  QualityJobResult,
} from '@ai-web-agency/shared';
import { Worker } from 'bullmq';
import { createQualityProcessor } from './processor.js';
export function createQualityWorker(
  repositories: {
    agentJobs: AgentJobRepository;
    websites: WebsiteRepository;
    qualityReports: QualityReportRepository;
  },
  browser: PlaywrightQualityAuditor,
  options?: { redisUrl?: string; previewBaseUrl?: string },
) {
  return new Worker<QualityJobPayload, QualityJobResult>(
    QUALITY_QUEUE_NAME,
    createQualityProcessor(
      repositories,
      browser,
      options?.previewBaseUrl ?? 'http://localhost:3002',
    ),
    {
      connection: createRedisConnection(options?.redisUrl ?? getRedisUrl()),
      concurrency: 1,
    },
  );
}
