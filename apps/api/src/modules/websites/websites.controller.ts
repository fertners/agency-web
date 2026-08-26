import {
  createRestaurantWebsiteRequestSchema,
  websiteIdSchema,
  websiteVersionIdSchema,
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
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  StreamableFile,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { WebsitesService } from './websites.service.js';

@Controller('websites')
export class WebsitesController {
  constructor(
    @Inject(WebsitesService) private readonly websitesService: WebsitesService,
  ) {}

  @Post('generate')
  generateRestaurant(
    @Body(new ZodValidationPipe(createRestaurantWebsiteRequestSchema))
    request: CreateRestaurantWebsiteRequest,
  ): Promise<CreateRestaurantWebsiteResponse> {
    return this.websitesService.generateRestaurant(request);
  }

  @Post(':websiteId/versions/:versionId/quality')
  startQualityReview(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<CreateQualityReviewResponse> {
    return this.websitesService.startQualityReview(websiteId, versionId);
  }

  @Get(':websiteId/versions/:versionId/quality-reports')
  listQualityReports(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<QualityReportListResponse> {
    return this.websitesService.listQualityReports(websiteId, versionId);
  }

  @Get()
  listRecent(): Promise<WebsiteListResponse> {
    return this.websitesService.listRecent();
  }

  @Get(':websiteId/versions/:versionId')
  findVersion(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<WebsiteVersionResponse> {
    return this.websitesService.findVersion(websiteId, versionId);
  }

  @Get(':websiteId/versions')
  listVersions(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
  ): Promise<WebsiteVersionListResponse> {
    return this.websitesService.listVersions(websiteId);
  }

  @Post(':websiteId/versions/:versionId/approve')
  approveVersion(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<WebsiteVersionResponse> {
    return this.websitesService.reviewVersion(websiteId, versionId, 'APPROVED');
  }

  @Post(':websiteId/versions/:versionId/design-review')
  startDesignReview(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<CreateDesignReviewResponse> {
    return this.websitesService.startDesignReview(websiteId, versionId);
  }

  @Get(':websiteId/versions/:versionId/design-reviews')
  listDesignReviews(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<DesignReviewListResponse> {
    return this.websitesService.listDesignReviews(websiteId, versionId);
  }

  @Get(
    ':websiteId/versions/:versionId/design-reviews/:reviewId/artifacts/:kind',
  )
  getDesignReviewArtifact(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
    @Param('reviewId') reviewId: string,
    @Param('kind') kind: string,
  ): Promise<StreamableFile> {
    if (kind !== 'desktop' && kind !== 'mobile')
      throw new Error('Invalid artifact kind');
    return this.websitesService.getDesignReviewArtifact(
      websiteId,
      versionId,
      reviewId,
      kind,
    );
  }

  @Post(':websiteId/versions/:versionId/reject')
  rejectVersion(
    @Param('websiteId', new ZodValidationPipe(websiteIdSchema))
    websiteId: string,
    @Param('versionId', new ZodValidationPipe(websiteVersionIdSchema))
    versionId: string,
  ): Promise<WebsiteVersionResponse> {
    return this.websitesService.reviewVersion(websiteId, versionId, 'REJECTED');
  }
}
