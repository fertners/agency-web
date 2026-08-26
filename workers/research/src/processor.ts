import type {
  AgentJobRepository,
  ProspectRepository,
} from '@ai-web-agency/database';
import {
  assessOpportunity,
  companyFingerprint,
  type BusinessSearchProvider,
} from '@ai-web-agency/prospects';
import { PROSPECT_JOB_ATTEMPTS } from '@ai-web-agency/queue';
import {
  prospectSearchJobPayloadSchema,
  prospectSearchJobResultSchema,
  type ProspectSearchJobPayload,
  type ProspectSearchJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
export function createResearchProcessor(
  repositories: {
    agentJobs: Pick<
      AgentJobRepository,
      'markRunning' | 'markCompleted' | 'markPendingRetry' | 'markFailed'
    >;
    prospects: Pick<ProspectRepository, 'upsert'>;
  },
  provider: BusinessSearchProvider,
) {
  return async (
    job: Job<ProspectSearchJobPayload, ProspectSearchJobResult>,
  ): Promise<ProspectSearchJobResult> => {
    if (!job.id) throw new Error('Research job requires an identifier');
    const payload = prospectSearchJobPayloadSchema.parse(job.data);
    const attempt = job.attemptsMade + 1;
    await repositories.agentJobs.markRunning(job.id, attempt);
    try {
      const candidates = await provider.search(payload);
      let created = 0;
      for (const candidate of candidates) {
        const result = await repositories.prospects.upsert(
          candidate,
          companyFingerprint(candidate),
          assessOpportunity(candidate),
        );
        if (result.created) created += 1;
      }
      const output = prospectSearchJobResultSchema.parse({
        jobId: job.id,
        discovered: candidates.length,
        created,
        updated: candidates.length - created,
      });
      await repositories.agentJobs.markCompleted(job.id, attempt, output);
      return output;
    } catch (error) {
      if (attempt >= (job.opts.attempts ?? PROSPECT_JOB_ATTEMPTS))
        await repositories.agentJobs.markFailed(
          job.id,
          attempt,
          'Prospect research failed',
        );
      else await repositories.agentJobs.markPendingRetry(job.id, attempt);
      throw error instanceof Error
        ? error
        : new Error('Prospect research failed');
    }
  };
}
