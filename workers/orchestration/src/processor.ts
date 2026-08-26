import type { AgentJobRepository } from '@ai-web-agency/database';
import {
  agentJobResponseSchema,
  createDesignReviewResponseSchema,
  createQualityReviewResponseSchema,
  createRestaurantWebsiteResponseSchema,
  designReviewJobResultSchema,
  generationJobResultSchema,
  prospectWorkflowJobPayloadSchema,
  prospectWorkflowJobResultSchema,
  proposalSchema,
  qualityJobResultSchema,
  type ProspectWorkflowJobPayload,
  type ProspectWorkflowJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';

type WorkflowRepository = Pick<
  AgentJobRepository,
  'markRunning' | 'markCompleted' | 'markFailed'
>;

type WorkflowOptions = Readonly<{
  apiBaseUrl: string;
  fetcher?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
  apiToken?: string;
}>;

async function requestJson(
  fetcher: typeof fetch,
  url: string,
  apiToken?: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetcher(url, {
    ...init,
    headers: (() => {
      const headers = new Headers(init?.headers);
      if (apiToken !== undefined)
        headers.set('authorization', `Bearer ${apiToken}`);
      return headers;
    })(),
    signal: AbortSignal.timeout(30_000),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : `Internal API request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function waitForJob(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  jobId: string,
  pollIntervalMs: number,
  timeoutMs: number,
  apiToken?: string,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = agentJobResponseSchema.parse(
      await requestJson(fetcher, `${apiBaseUrl}/jobs/${jobId}`, apiToken),
    );
    if (job.status === 'COMPLETED') {
      if (job.output === null) throw new Error('Child job returned no output');
      return job.output;
    }
    if (['FAILED', 'CANCELLED', 'NEEDS_REVIEW'].includes(job.status))
      throw new Error(job.error ?? `Child job ended with ${job.status}`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error('Child job timed out');
}

export function createProspectWorkflowProcessor(
  repository: WorkflowRepository,
  options: WorkflowOptions,
) {
  const fetcher = options.fetcher ?? fetch;
  const apiBaseUrl = options.apiBaseUrl.replace(/\/$/, '');
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const timeoutMs = options.timeoutMs ?? 15 * 60_000;
  const apiToken = options.apiToken?.trim() || undefined;

  return async (
    job: Job<ProspectWorkflowJobPayload, ProspectWorkflowJobResult>,
  ): Promise<ProspectWorkflowJobResult> => {
    if (job.id === undefined) throw new Error('Workflow job requires an id');
    const payload = prospectWorkflowJobPayloadSchema.parse(job.data);
    await repository.markRunning(job.id, 1);
    try {
      const generation = createRestaurantWebsiteResponseSchema.parse(
        await requestJson(
          fetcher,
          `${apiBaseUrl}/websites/from-prospect/${payload.prospectId}`,
          apiToken,
          { method: 'POST', headers: { 'content-type': 'application/json' } },
        ),
      );
      const generationResult = generationJobResultSchema.parse(
        await waitForJob(
          fetcher,
          apiBaseUrl,
          generation.jobId,
          pollIntervalMs,
          timeoutMs,
          apiToken,
        ),
      );
      const design = createDesignReviewResponseSchema.parse(
        await requestJson(
          fetcher,
          `${apiBaseUrl}/websites/${generation.websiteId}/versions/${generationResult.versionId}/design-review`,
          apiToken,
          { method: 'POST', headers: { 'content-type': 'application/json' } },
        ),
      );
      const designResult = designReviewJobResultSchema.parse(
        await waitForJob(
          fetcher,
          apiBaseUrl,
          design.jobId,
          pollIntervalMs,
          timeoutMs,
          apiToken,
        ),
      );
      const versionId =
        designResult.correctedVersionId ?? designResult.versionId;
      const quality = createQualityReviewResponseSchema.parse(
        await requestJson(
          fetcher,
          `${apiBaseUrl}/websites/${generation.websiteId}/versions/${versionId}/quality`,
          apiToken,
          { method: 'POST', headers: { 'content-type': 'application/json' } },
        ),
      );
      qualityJobResultSchema.parse(
        await waitForJob(
          fetcher,
          apiBaseUrl,
          quality.jobId,
          pollIntervalMs,
          timeoutMs,
          apiToken,
        ),
      );
      const proposal = proposalSchema.parse(
        await requestJson(
          fetcher,
          `${apiBaseUrl}/prospects/${payload.prospectId}/proposals`,
          apiToken,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              websiteType: payload.websiteType,
              currency: payload.currency,
              timelineDays: payload.timelineDays,
              scope: payload.scope,
            }),
          },
        ),
      );
      const result = prospectWorkflowJobResultSchema.parse({
        prospectId: payload.prospectId,
        websiteId: generation.websiteId,
        versionId,
        proposalId: proposal.id,
        proposalStatus: proposal.status,
      });
      await repository.markCompleted(job.id, 1, result);
      return result;
    } catch (error) {
      await repository.markFailed(
        job.id,
        1,
        error instanceof Error
          ? `Prospect workflow failed: ${error.message}`
          : 'Prospect workflow failed',
      );
      throw error instanceof Error ? error : new Error('Workflow failed');
    }
  };
}
