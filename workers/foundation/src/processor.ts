import type { AgentJobRepository } from '@ai-web-agency/database';
import {
  DIAGNOSTIC_JOB_ATTEMPTS,
  type DiagnosticJobResult,
} from '@ai-web-agency/queue';
import type { DiagnosticJobPayload } from '@ai-web-agency/shared';
import type { Job } from 'bullmq';

export type DiagnosticHandler = (
  payload: DiagnosticJobPayload,
) => Promise<DiagnosticJobResult>;

const defaultHandler: DiagnosticHandler = () =>
  Promise.resolve({
    processedAt: new Date().toISOString(),
    worker: 'foundation',
  });

export function createDiagnosticProcessor(
  repository: AgentJobRepository,
  handler: DiagnosticHandler = defaultHandler,
) {
  return async (
    job: Job<DiagnosticJobPayload, DiagnosticJobResult>,
  ): Promise<DiagnosticJobResult> => {
    if (job.id === undefined) {
      throw new Error('Diagnostic job requires an identifier');
    }

    const attempt = job.attemptsMade + 1;
    await repository.markRunning(job.id, attempt);

    try {
      const result = await handler(job.data);
      await repository.markCompleted(job.id, attempt, result);
      return result;
    } catch (error) {
      if (attempt >= (job.opts.attempts ?? DIAGNOSTIC_JOB_ATTEMPTS)) {
        await repository.markFailed(job.id, attempt, 'Diagnostic job failed');
      } else {
        await repository.markPendingRetry(job.id, attempt);
      }

      throw error instanceof Error ? error : new Error('Diagnostic job failed');
    }
  };
}
