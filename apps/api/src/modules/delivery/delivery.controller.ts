import {
  attachProjectWebsiteRequestSchema,
  convertProspectRequestSchema,
  createDeploymentRequestSchema,
  rollbackDeploymentRequestSchema,
  type AttachProjectWebsiteRequest,
  type Client,
  type ClientDetail,
  type ClientListResponse,
  type ConvertProspectRequest,
  type CreateDeploymentRequest,
  type CreateDeploymentResponse,
  type Deployment,
  type DeploymentListResponse,
  type Project,
  type ProjectListResponse,
  type RollbackDeploymentRequest,
} from '@ai-web-agency/shared';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { DeliveryService } from './delivery.service.js';
const uuidSchema = z.uuid();

@Controller()
export class DeliveryController {
  constructor(
    @Inject(DeliveryService) private readonly service: DeliveryService,
  ) {}
  @Post('prospects/:id/convert') convert(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(convertProspectRequestSchema))
    request: ConvertProspectRequest,
  ): Promise<{ client: Client; project: Project }> {
    return this.service.convert(id, request);
  }
  @Get('clients') clients(): Promise<ClientListResponse> {
    return this.service.listClients();
  }
  @Get('clients/:id') client(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<ClientDetail> {
    return this.service.getClient(id);
  }
  @Get('projects') projects(): Promise<ProjectListResponse> {
    return this.service.listProjects();
  }
  @Patch('projects/:id/website') attach(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(attachProjectWebsiteRequestSchema))
    request: AttachProjectWebsiteRequest,
  ): Promise<Project> {
    return this.service.attach(id, request);
  }
  @Post('projects/:id/deployments') deploy(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createDeploymentRequestSchema))
    request: CreateDeploymentRequest,
  ): Promise<CreateDeploymentResponse> {
    return this.service.deploy(id, request);
  }
  @Get('deployments') deployments(): Promise<DeploymentListResponse> {
    return this.service.listDeployments();
  }
  @Post('projects/:id/rollback') rollback(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(rollbackDeploymentRequestSchema))
    request: RollbackDeploymentRequest,
  ): Promise<Deployment> {
    return this.service.rollback(id, request);
  }
}
