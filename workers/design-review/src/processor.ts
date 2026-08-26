import type { AIClient } from '@ai-web-agency/ai';
import type { PlaywrightWebsiteReviewer } from '@ai-web-agency/browser';
import type {
  AgentJobRepository,
  DesignReviewRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { DESIGN_REVIEW_JOB_ATTEMPTS } from '@ai-web-agency/queue';
import {
  DESIGN_REVIEW_MAX_ITERATIONS,
  DESIGN_REVIEW_PASS_SCORE,
  designReviewJobPayloadSchema,
  designReviewJobResultSchema,
  type DesignReviewJobPayload,
  type DesignReviewJobResult,
  type BrowserReviewReport,
} from '@ai-web-agency/shared';
import { applyWebsiteCorrection } from '@ai-web-agency/websites';
import type { Job } from 'bullmq';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function loadReviewScreenshots(
  artifactsRoot: string,
  report: Pick<BrowserReviewReport, 'screenshots'>,
) {
  const root = path.resolve(artifactsRoot);
  return Promise.all(
    report.screenshots.map(async (artifact) => {
      const target = path.resolve(root, artifact.path);
      if (!target.startsWith(`${root}${path.sep}`))
        throw new Error('Screenshot path escapes artifacts root');
      return {
        mimeType: artifact.mimeType,
        base64: (await readFile(target)).toString('base64'),
      } as const;
    }),
  );
}

export function createDesignReviewProcessor(
  repositories: {
    agentJobs: Pick<
      AgentJobRepository,
      'markRunning' | 'markCompleted' | 'markPendingRetry' | 'markFailed'
    >;
    websites: Pick<WebsiteRepository, 'findVersion' | 'createVersion'>;
    designReviews: Pick<DesignReviewRepository, 'start' | 'complete' | 'fail'>;
  },
  ai: AIClient,
  browser: PlaywrightWebsiteReviewer,
  options: { previewBaseUrl: string; artifactsRoot: string },
) {
  return async (
    job: Job<DesignReviewJobPayload, DesignReviewJobResult>,
  ): Promise<DesignReviewJobResult> => {
    if (job.id === undefined)
      throw new Error('Design review job requires an identifier');
    const payload = designReviewJobPayloadSchema.parse(job.data);
    const attempt = job.attemptsMade + 1;
    await repositories.agentJobs.markRunning(job.id, attempt);
    let currentVersionId = payload.versionId;
    let reviewId = '';
    try {
      for (
        let iteration = payload.iteration;
        iteration <= DESIGN_REVIEW_MAX_ITERATIONS;
        iteration += 1
      ) {
        const version = await repositories.websites.findVersion(
          payload.websiteId,
          currentVersionId,
        );
        if (version === undefined) throw new Error('Website version not found');
        const review = await repositories.designReviews.start({
          websiteVersionId: currentVersionId,
          agentJobId: job.id,
          iteration,
        });
        reviewId = review.id;
        const browserReport = await browser.review({
          url: `${options.previewBaseUrl}/preview/${payload.websiteId}/${currentVersionId}`,
          websiteId: payload.websiteId,
          versionId: currentVersionId,
          artifactsRoot: options.artifactsRoot,
        });
        const screenshots = ai.supportsVision
          ? await loadReviewScreenshots(options.artifactsRoot, browserReport)
          : undefined;
        const result = await ai.reviewWebsiteDesign({
          config: version.config,
          browserReport,
          ...(screenshots === undefined ? {} : { screenshots }),
          jobId: job.id,
        });
        const passed =
          result.score >= DESIGN_REVIEW_PASS_SCORE &&
          !result.issues.some((issue) => issue.severity === 'BLOCKING');
        if (passed || iteration === DESIGN_REVIEW_MAX_ITERATIONS) {
          await repositories.designReviews.complete(
            review.id,
            browserReport,
            result,
          );
          const output = designReviewJobResultSchema.parse({
            reviewId: review.id,
            websiteId: payload.websiteId,
            versionId: currentVersionId,
            iteration,
            score: result.score,
            passed,
            correctedVersionId: null,
          });
          await repositories.agentJobs.markCompleted(job.id, attempt, output);
          return output;
        }
        const patch = await ai.proposeWebsiteCorrection({
          config: version.config,
          review: result,
          jobId: job.id,
        });
        const corrected = await repositories.websites.createVersion(
          payload.websiteId,
          applyWebsiteCorrection(version.config, patch),
          { ready: true },
        );
        await repositories.designReviews.complete(
          review.id,
          browserReport,
          result,
          corrected.id,
        );
        currentVersionId = corrected.id;
      }
      throw new Error('Design review iteration limit exceeded');
    } catch (error) {
      if (reviewId !== '') await repositories.designReviews.fail(reviewId);
      if (attempt >= (job.opts.attempts ?? DESIGN_REVIEW_JOB_ATTEMPTS))
        await repositories.agentJobs.markFailed(
          job.id,
          attempt,
          'Website design review failed',
        );
      else await repositories.agentJobs.markPendingRetry(job.id, attempt);
      throw error instanceof Error
        ? error
        : new Error('Website design review failed');
    }
  };
}
