import type {
  AgentJobRepository,
  DeliveryRepository,
} from '@ai-web-agency/database';
import { DEPLOYMENT_JOB_ATTEMPTS } from '@ai-web-agency/queue';
import {
  deploymentJobPayloadSchema,
  deploymentJobResultSchema,
  type DeploymentJobPayload,
  type DeploymentJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
import type { DeploymentService } from './provider.js';

export function createDeploymentProcessor(
  repositories: {
    agentJobs: Pick<
      AgentJobRepository,
      'markRunning' | 'markCompleted' | 'markPendingRetry' | 'markFailed'
    >;
    delivery: Pick<
      DeliveryRepository,
      'markDeploymentRunning' | 'completeDeployment' | 'failDeployment'
    >;
  },
  provider: DeploymentService,
) {
  return async (
    job: Job<DeploymentJobPayload, DeploymentJobResult>,
  ): Promise<DeploymentJobResult> => {
    if (!job.id) throw new Error('Deployment job requires an identifier');
    const payload = deploymentJobPayloadSchema.parse(job.data);
    const attempt = job.attemptsMade + 1;
    await repositories.agentJobs.markRunning(job.id, attempt);
    await repositories.delivery.markDeploymentRunning(payload.deploymentId);
    try {
      const result = await provider.deploy(payload);
      await repositories.delivery.completeDeployment(
        payload.deploymentId,
        result.url,
      );
      const output = deploymentJobResultSchema.parse({
        deploymentId: payload.deploymentId,
        url: result.url,
        status: 'COMPLETED',
      });
      await repositories.agentJobs.markCompleted(job.id, attempt, output);
      return output;
    } catch (error) {
      if (attempt >= (job.opts.attempts ?? DEPLOYMENT_JOB_ATTEMPTS)) {
        await repositories.delivery.failDeployment(payload.deploymentId);
        await repositories.agentJobs.markFailed(
          job.id,
          attempt,
          'Local deployment failed',
        );
      } else await repositories.agentJobs.markPendingRetry(job.id, attempt);
      throw error instanceof Error
        ? error
        : new Error('Local deployment failed');
    }
  };
}
