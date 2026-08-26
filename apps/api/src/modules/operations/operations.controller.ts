import {
  companyQuerySchema,
  dashboardQuerySchema,
  paginationQuerySchema,
  prospectQuerySchema,
  updateCompanyRequestSchema,
  updateSettingsRequestSchema,
  type Analytics,
  type CompanyDetail,
  type CompanyListResponse,
  type CompanyQuery,
  type DashboardOverview,
  type DashboardQuery,
  type OperationsJobDetail,
  type OperationsJobList,
  type PaginatedProspectList,
  type PaginationQuery,
  type ProspectQuery,
  type SettingsResponse,
  type TemplateList,
  type TemplateDetail,
  type UpdateCompanyRequest,
  type UpdateSettingsRequest,
} from '@ai-web-agency/shared';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { OperationsService } from './operations.service.js';

const uuidSchema = z.uuid();

@Controller()
export class OperationsController {
  constructor(
    @Inject(OperationsService) private readonly service: OperationsService,
  ) {}

  @Get('dashboard/overview')
  overview(
    @Query(new ZodValidationPipe(dashboardQuerySchema)) query: DashboardQuery,
  ): Promise<DashboardOverview> {
    return this.service.overview(query);
  }

  @Get('analytics')
  analytics(
    @Query(new ZodValidationPipe(dashboardQuerySchema)) query: DashboardQuery,
  ): Promise<Analytics> {
    return this.service.analytics(query);
  }

  @Get('companies')
  companies(
    @Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQuery,
  ): Promise<CompanyListResponse> {
    return this.service.companies(query);
  }

  @Get('companies/:id')
  company(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<CompanyDetail> {
    return this.service.company(id);
  }

  @Patch('companies/:id')
  updateCompany(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateCompanyRequestSchema))
    request: UpdateCompanyRequest,
  ): Promise<CompanyDetail> {
    return this.service.updateCompany(id, request);
  }

  @Get('prospect-directory')
  prospects(
    @Query(new ZodValidationPipe(prospectQuerySchema)) query: ProspectQuery,
  ): Promise<PaginatedProspectList> {
    return this.service.prospects(query);
  }

  @Get('agent-jobs')
  jobs(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ): Promise<OperationsJobList> {
    return this.service.jobs(query);
  }

  @Get('agent-jobs/:id')
  job(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<OperationsJobDetail> {
    return this.service.job(id);
  }

  @Get('templates')
  templates(): Promise<TemplateList> {
    return this.service.templates();
  }

  @Get('templates/:id')
  template(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<TemplateDetail> {
    return this.service.template(id);
  }

  @Get('settings')
  settings(): Promise<SettingsResponse> {
    return this.service.settings();
  }

  @Patch('settings')
  updateSettings(
    @Body(new ZodValidationPipe(updateSettingsRequestSchema))
    request: UpdateSettingsRequest,
  ): Promise<SettingsResponse> {
    return this.service.updateSettings(request);
  }
}
