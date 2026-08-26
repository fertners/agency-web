import type { AIClient } from '@ai-web-agency/ai';
import type {
  AgentJobRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { GENERATION_JOB_ATTEMPTS } from '@ai-web-agency/queue';
import {
  generationJobPayloadSchema,
  generationJobResultSchema,
  type GenerationJobPayload,
  type GenerationJobResult,
} from '@ai-web-agency/shared';
import { generateRestaurantConfig } from '@ai-web-agency/websites';
import type { Job } from 'bullmq';

type GenerationRepositories = Readonly<{
  agentJobs: Pick<
    AgentJobRepository,
    'markRunning' | 'markCompleted' | 'markPendingRetry' | 'markFailed'
  >;
  websites: Pick<WebsiteRepository, 'findBusinessForWebsite' | 'createVersion'>;
}>;

export function createGenerationProcessor(
  repositories: GenerationRepositories,
  ai: AIClient,
) {
  return async (
    job: Job<GenerationJobPayload, GenerationJobResult>,
  ): Promise<GenerationJobResult> => {
    if (job.id === undefined)
      throw new Error('Generation job requires an identifier');
    const payload = generationJobPayloadSchema.parse(job.data);
    const attempt = job.attemptsMade + 1;
    await repositories.agentJobs.markRunning(job.id, attempt);

    try {
      const business = await repositories.websites.findBusinessForWebsite(
        payload.websiteId,
      );
      if (business === undefined) throw new Error('Website business not found');

      const briefs = await ai.generateRestaurantBrief({
        business: business.data,
        jobId: job.id,
      });
      const config = generateRestaurantConfig(
        business.data,
        new Date(),
        briefs,
      );
      const version = await repositories.websites.createVersion(
        payload.websiteId,
        config,
        { agentJobId: job.id, ready: true },
      );
      const result = generationJobResultSchema.parse({
        websiteId: payload.websiteId,
        versionId: version.id,
        version: version.version,
        previewPath: `/preview/${payload.websiteId}/${version.id}`,
      });
      await repositories.agentJobs.markCompleted(job.id, attempt, result);
      return result;
    } catch (error) {
      if (attempt >= (job.opts.attempts ?? GENERATION_JOB_ATTEMPTS)) {
        await repositories.agentJobs.markFailed(
          job.id,
          attempt,
          'Website generation failed',
        );
      } else {
        await repositories.agentJobs.markPendingRetry(job.id, attempt);
      }
      throw error instanceof Error
        ? error
        : new Error('Website generation failed');
    }
  };
}
