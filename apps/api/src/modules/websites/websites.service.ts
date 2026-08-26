import {
  createDesignReviewResponseSchema,
  createRestaurantWebsiteResponseSchema,
  designReviewJobPayloadSchema,
  designReviewListResponseSchema,
  createQualityReviewResponseSchema,
  qualityJobPayloadSchema,
  qualityReportListResponseSchema,
  generationJobPayloadSchema,
  websiteListResponseSchema,
  websiteVersionListResponseSchema,
  websiteVersionResponseSchema,
  type CreateRestaurantWebsiteRequest,
  type CreateRestaurantWebsiteResponse,
  type CreateDesignReviewResponse,
  type DesignReviewListResponse,
  type CreateQualityReviewResponse,
  type QualityReportListResponse,
  type WebsiteListResponse,
  type WebsiteVersionListResponse,
  type WebsiteVersionResponse,
} from '@ai-web-agency/shared';
import {
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

function defaultArtifactsRoot(): string {
  let directory = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    if (existsSync(path.join(directory, 'pnpm-workspace.yaml')))
      return path.join(directory, 'artifacts');
    directory = path.dirname(directory);
  }
  throw new Error('Monorepo root not found');
}

import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { GenerationQueueService } from '../../infrastructure/queue/generation-queue.service.js';
import { DesignReviewQueueService } from '../../infrastructure/queue/design-review-queue.service.js';
import { QualityQueueService } from '../../infrastructure/queue/quality-queue.service.js';

@Injectable()
export class WebsitesService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(GenerationQueueService)
    private readonly generationQueue: GenerationQueueService,
    @Inject(DesignReviewQueueService)
    private readonly designReviewQueue: DesignReviewQueueService,
    @Inject(QualityQueueService)
    private readonly qualityQueue: QualityQueueService,
  ) {}

  async startQualityReview(
    websiteId: string,
    versionId: string,
  ): Promise<CreateQualityReviewResponse> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    if (version === undefined)
      throw new NotFoundException('Website version not found');
    const payload = qualityJobPayloadSchema.parse({ websiteId, versionId });
    const job = await this.database.agentJobs.createTyped(
      'website.quality',
      payload,
    );
    try {
      const queueJobId = await this.qualityQueue.add(job.id, payload);
      await this.database.agentJobs.markQueued(
        job.id,
        this.qualityQueue.name,
        queueJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(
        job.id,
        0,
        'Unable to enqueue website quality audit',
      );
      throw new Error('Unable to enqueue website quality audit');
    }
    return createQualityReviewResponseSchema.parse({
      jobId: job.id,
      status: 'PENDING',
    });
  }

  async listQualityReports(
    websiteId: string,
    versionId: string,
  ): Promise<QualityReportListResponse> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    if (version === undefined)
      throw new NotFoundException('Website version not found');
    const reports =
      await this.database.qualityReports.listForVersion(versionId);
    return qualityReportListResponseSchema.parse({
      reports: reports.map((report) => ({
        reportId: report.id,
        websiteId,
        versionId,
        status: report.status,
        report: report.report,
        createdAt: report.createdAt.toISOString(),
        completedAt: report.completedAt?.toISOString() ?? null,
      })),
    });
  }

  async startDesignReview(
    websiteId: string,
    versionId: string,
  ): Promise<CreateDesignReviewResponse> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    if (version === undefined)
      throw new NotFoundException('Website version not found');
    const payload = designReviewJobPayloadSchema.parse({
      websiteId,
      versionId,
      iteration: 1,
    });
    const job = await this.database.agentJobs.createTyped(
      'website.design-review',
      payload,
    );
    try {
      const queueJobId = await this.designReviewQueue.add(job.id, payload);
      await this.database.agentJobs.markQueued(
        job.id,
        this.designReviewQueue.name,
        queueJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(
        job.id,
        0,
        'Unable to enqueue website design review',
      );
      throw new Error('Unable to enqueue website design review');
    }
    return createDesignReviewResponseSchema.parse({
      jobId: job.id,
      status: 'PENDING',
    });
  }

  async listDesignReviews(
    websiteId: string,
    versionId: string,
  ): Promise<DesignReviewListResponse> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    if (version === undefined)
      throw new NotFoundException('Website version not found');
    const reviews = await this.database.designReviews.listForVersion(versionId);
    return designReviewListResponseSchema.parse({
      reviews: reviews.map((review) => ({
        reviewId: review.id,
        websiteId,
        versionId,
        correctedVersionId: review.correctedVersionId,
        iteration: review.iteration,
        status: review.status,
        result: review.result,
        browserReport: review.browserReport,
        createdAt: review.createdAt.toISOString(),
        completedAt: review.completedAt?.toISOString() ?? null,
      })),
    });
  }

  async getDesignReviewArtifact(
    websiteId: string,
    versionId: string,
    reviewId: string,
    kind: 'desktop' | 'mobile',
  ): Promise<StreamableFile> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    const review = await this.database.designReviews.findById(reviewId);
    if (
      version === undefined ||
      review === undefined ||
      review.websiteVersionId !== versionId ||
      review.browserReport === null
    )
      throw new NotFoundException('Design review artifact not found');
    const artifactKind =
      kind === 'desktop' ? 'DESKTOP_SCREENSHOT' : 'MOBILE_SCREENSHOT';
    const artifact = review.browserReport.screenshots.find(
      (item) => item.kind === artifactKind,
    );
    if (artifact === undefined)
      throw new NotFoundException('Design review artifact not found');
    const root = path.resolve(
      process.env.ARTIFACTS_ROOT ?? defaultArtifactsRoot(),
    );
    const absolutePath = path.resolve(root, artifact.path);
    if (!absolutePath.startsWith(`${root}${path.sep}`))
      throw new NotFoundException('Design review artifact not found');
    try {
      await stat(absolutePath);
    } catch {
      throw new NotFoundException('Design review artifact not found');
    }
    return new StreamableFile(createReadStream(absolutePath), {
      type: 'image/png',
    });
  }

  async generateRestaurant(
    request: CreateRestaurantWebsiteRequest,
  ): Promise<CreateRestaurantWebsiteResponse> {
    const created =
      await this.database.websites.createRestaurantWebsite(request);
    const payload = generationJobPayloadSchema.parse({
      websiteId: created.website.id,
    });
    const job = await this.database.agentJobs.createTyped(
      'website.generate.restaurant',
      payload,
    );

    try {
      const queuedJobId = await this.generationQueue.addRestaurantGeneration(
        job.id,
        payload,
      );
      await this.database.agentJobs.markQueued(
        job.id,
        this.generationQueue.name,
        queuedJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(
        job.id,
        0,
        'Unable to enqueue website generation',
      );
      throw new Error('Unable to enqueue website generation');
    }

    return createRestaurantWebsiteResponseSchema.parse({
      websiteId: created.website.id,
      jobId: job.id,
      status: 'PENDING',
    });
  }

  async listRecent(): Promise<WebsiteListResponse> {
    const items = await this.database.websites.listRecent();
    return websiteListResponseSchema.parse({
      websites: items.map(({ website, business, latestVersion }) => ({
        websiteId: website.id,
        businessId: business.id,
        name: business.name,
        slug: business.slug,
        status: website.status,
        templateKey: website.templateKey,
        latestVersion:
          latestVersion === undefined
            ? null
            : {
                versionId: latestVersion.id,
                version: latestVersion.version,
                status: latestVersion.status,
              },
        createdAt: website.createdAt.toISOString(),
      })),
    });
  }

  async findVersion(
    websiteId: string,
    versionId: string,
  ): Promise<WebsiteVersionResponse> {
    const version = await this.database.websites.findVersion(
      websiteId,
      versionId,
    );
    if (version === undefined)
      throw new NotFoundException('Website version not found');

    return this.toVersionResponse(version);
  }

  async listVersions(websiteId: string): Promise<WebsiteVersionListResponse> {
    const website = await this.database.websites.findWebsiteById(websiteId);
    if (website === undefined) throw new NotFoundException('Website not found');
    const versions = await this.database.websites.listVersions(websiteId);
    return websiteVersionListResponseSchema.parse({
      versions: versions.map((version) => this.toVersionResponse(version)),
    });
  }

  async reviewVersion(
    websiteId: string,
    versionId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<WebsiteVersionResponse> {
    try {
      const version = await this.database.websites.setVersionReviewStatus(
        websiteId,
        versionId,
        status,
      );
      return this.toVersionResponse(version);
    } catch {
      throw new NotFoundException('Website version not found');
    }
  }

  private toVersionResponse(version: {
    id: string;
    websiteId: string;
    version: number;
    status: string;
    config: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): WebsiteVersionResponse {
    return websiteVersionResponseSchema.parse({
      websiteId: version.websiteId,
      versionId: version.id,
      version: version.version,
      status: version.status,
      config: version.config,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    });
  }
}
