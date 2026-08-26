import type { PlaywrightQualityAuditor } from '@ai-web-agency/browser';
import type {
  AgentJobRepository,
  QualityReportRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { QUALITY_JOB_ATTEMPTS } from '@ai-web-agency/queue';
import { auditRestaurantSeo } from '@ai-web-agency/seo';
import {
  qualityJobPayloadSchema,
  qualityJobResultSchema,
  qualityReportSchema,
  type QualityJobPayload,
  type QualityJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
export function createQualityProcessor(
  repositories: {
    agentJobs: Pick<
      AgentJobRepository,
      'markRunning' | 'markCompleted' | 'markPendingRetry' | 'markFailed'
    >;
    websites: Pick<WebsiteRepository, 'findVersion'>;
    qualityReports: Pick<
      QualityReportRepository,
      'start' | 'complete' | 'fail'
    >;
  },
  browser: PlaywrightQualityAuditor,
  previewBaseUrl: string,
) {
  return async (
    job: Job<QualityJobPayload, QualityJobResult>,
  ): Promise<QualityJobResult> => {
    if (job.id === undefined)
      throw new Error('Quality job requires an identifier');
    const payload = qualityJobPayloadSchema.parse(job.data);
    const attempt = job.attemptsMade + 1;
    await repositories.agentJobs.markRunning(job.id, attempt);
    let reportId = '';
    try {
      const version = await repositories.websites.findVersion(
        payload.websiteId,
        payload.versionId,
      );
      if (version === undefined) throw new Error('Website version not found');
      const row = await repositories.qualityReports.start(
        payload.versionId,
        job.id,
      );
      reportId = row.id;
      const canonical = `https://example.invalid/${version.config.business.slug}`;
      const seo = auditRestaurantSeo(version.config, canonical);
      const technical = await browser.audit(
        `${previewBaseUrl}/preview/${payload.websiteId}/${payload.versionId}`,
      );
      const issues = [
        ...seo.issues,
        ...technical.accessibility.issues,
        ...technical.performance.issues,
      ];
      const score = Math.round(
        (seo.score +
          technical.accessibility.score +
          technical.performance.score) /
          3,
      );
      const blocking = issues.some((issue) => issue.severity === 'BLOCKING');
      const status =
        blocking ||
        score < 80 ||
        seo.score < 85 ||
        technical.accessibility.score < 85 ||
        technical.performance.score < 75
          ? 'NEEDS_REVIEW'
          : 'PASSED';
      const report = qualityReportSchema.parse({
        score,
        status,
        seo,
        ...technical,
        issues,
        summary:
          status === 'PASSED'
            ? 'Les seuils SEO, accessibilité et performance sont atteints.'
            : 'Une intervention est nécessaire avant publication.',
      });
      await repositories.qualityReports.complete(row.id, report);
      const output = qualityJobResultSchema.parse({
        reportId: row.id,
        ...payload,
        score,
        status,
      });
      await repositories.agentJobs.markCompleted(job.id, attempt, output);
      return output;
    } catch (error) {
      if (reportId !== '') await repositories.qualityReports.fail(reportId);
      if (attempt >= (job.opts.attempts ?? QUALITY_JOB_ATTEMPTS))
        await repositories.agentJobs.markFailed(
          job.id,
          attempt,
          'Website quality audit failed',
        );
      else await repositories.agentJobs.markPendingRetry(job.id, attempt);
      throw error instanceof Error
        ? error
        : new Error('Website quality audit failed');
    }
  };
}
