import {
  agentJobIdSchema,
  createDiagnosticJobRequestSchema,
  type AgentJobResponse,
  type AgentJobListResponse,
  type CreateDiagnosticJobRequest,
  type CreateDiagnosticJobResponse,
} from '@ai-web-agency/shared';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { JobsService } from './jobs.service.js';

@Controller('jobs')
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobsService: JobsService) {}

  @Post('diagnostic')
  createDiagnostic(
    @Body(new ZodValidationPipe(createDiagnosticJobRequestSchema))
    request: CreateDiagnosticJobRequest,
  ): Promise<CreateDiagnosticJobResponse> {
    return this.jobsService.createDiagnostic(request);
  }

  @Get()
  listRecent(): Promise<AgentJobListResponse> {
    return this.jobsService.listRecent();
  }

  @Get(':id')
  findById(
    @Param('id', new ZodValidationPipe(agentJobIdSchema)) id: string,
  ): Promise<AgentJobResponse> {
    return this.jobsService.findById(id);
  }
}
