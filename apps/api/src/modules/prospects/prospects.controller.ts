import {
  prospectSearchRequestSchema,
  type CreateProspectSearchResponse,
  type ProspectListResponse,
  type ProspectSearchRequest,
} from '@ai-web-agency/shared';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { ProspectsService } from './prospects.service.js';
@Controller('prospects')
export class ProspectsController {
  constructor(
    @Inject(ProspectsService) private readonly service: ProspectsService,
  ) {}
  @Post('search') search(
    @Body(new ZodValidationPipe(prospectSearchRequestSchema))
    request: ProspectSearchRequest,
  ): Promise<CreateProspectSearchResponse> {
    return this.service.search(request);
  }
  @Get() list(): Promise<ProspectListResponse> {
    return this.service.list();
  }
}
