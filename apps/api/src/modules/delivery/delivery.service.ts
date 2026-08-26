import {
  attachProjectWebsiteRequestSchema,
  clientListResponseSchema,
  clientDetailSchema,
  clientSchema,
  convertProspectRequestSchema,
  createDeploymentRequestSchema,
  createDeploymentResponseSchema,
  deploymentJobPayloadSchema,
  deploymentListResponseSchema,
  deploymentSchema,
  projectListResponseSchema,
  projectSchema,
  rollbackDeploymentRequestSchema,
  type AttachProjectWebsiteRequest,
  type Client,
  type ClientDetail,
  type ClientListResponse,
  type ConvertProspectRequest,
  type CreateDeploymentRequest,
  type CreateDeploymentResponse,
  type Deployment,
  type DeploymentProvider,
  type DeploymentListResponse,
  type Project,
  type ProjectListResponse,
  type RollbackDeploymentRequest,
} from '@ai-web-agency/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { DeploymentQueueService } from '../../infrastructure/queue/deployment-queue.service.js';

function toClient(row: {
  id: string;
  prospectId: string;
  companyId: string | null;
  name: string;
  status:
    'ONBOARDING' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'INACTIVE';
  convertedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): Client {
  return clientSchema.parse({
    ...row,
    convertedAt: row.convertedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
function toProject(row: {
  id: string;
  clientId: string;
  proposalId: string;
  name: string;
  status: 'PLANNED' | 'ACTIVE' | 'DELIVERED' | 'ARCHIVED';
  websiteId: string | null;
  versionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return projectSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
function toDeployment(row: {
  id: string;
  projectId: string;
  websiteId: string;
  versionId: string;
  agentJobId: string | null;
  environment: 'PREVIEW' | 'PRODUCTION';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  provider: string;
  url: string | null;
  isActive: boolean;
  replacesDeploymentId: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): Deployment {
  return deploymentSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  });
}

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(DeploymentQueueService)
    private readonly queue: DeploymentQueueService,
  ) {}

  async convert(
    prospectId: string,
    request: ConvertProspectRequest,
  ): Promise<{ client: Client; project: Project }> {
    const input = convertProspectRequestSchema.parse(request);
    const result = await this.database.delivery.convertProspect(
      prospectId,
      input.proposalId,
    );
    if (!result)
      throw new NotFoundException('Approved proposal not found for prospect');
    return {
      client: toClient(result.client),
      project: toProject(result.project),
    };
  }
  async listClients(): Promise<ClientListResponse> {
    return clientListResponseSchema.parse({
      clients: (await this.database.delivery.listClients()).map(toClient),
    });
  }
  async getClient(id: string): Promise<ClientDetail> {
    const result = await this.database.delivery.getClientDetail(id);
    if (!result) throw new NotFoundException('Client not found');
    return clientDetailSchema.parse({
      client: toClient(result.client),
      projects: result.projects.map(toProject),
      payments: result.payments.map((payment) => ({
        id: payment.id,
        projectId: payment.projectId,
        provider: payment.provider,
        status: payment.status,
        amountCents: payment.amountCents,
        currency: payment.currency,
        createdAt: payment.createdAt.toISOString(),
      })),
      requests: result.requests.map((request) => ({
        id: request.id,
        projectId: request.projectId,
        websiteId: request.websiteId,
        status: request.status,
        request: request.request,
        createdAt: request.createdAt.toISOString(),
      })),
      conversationIds: result.conversationIds,
    });
  }
  async listProjects(): Promise<ProjectListResponse> {
    return projectListResponseSchema.parse({
      projects: (await this.database.delivery.listProjects()).map(toProject),
    });
  }
  async attach(
    projectId: string,
    request: AttachProjectWebsiteRequest,
  ): Promise<Project> {
    const input = attachProjectWebsiteRequestSchema.parse(request);
    const row = await this.database.delivery.attachWebsite(
      projectId,
      input.websiteId,
      input.versionId,
    );
    if (!row)
      throw new NotFoundException(
        'Approved website version or project not found',
      );
    return toProject(row);
  }
  async deploy(
    projectId: string,
    request: CreateDeploymentRequest,
  ): Promise<CreateDeploymentResponse> {
    const input = createDeploymentRequestSchema.parse(request);
    const project = await this.database.delivery.findProject(projectId);
    if (!project?.websiteId || !project.versionId)
      throw new NotFoundException('Project has no approved website version');
    const provider = this.deploymentProvider();
    const job = await this.database.agentJobs.createTyped(
      `deployment.${provider}`,
      { projectId, ...input },
    );
    const deployment = await this.database.delivery.createDeployment(
      projectId,
      project.websiteId,
      project.versionId,
      input.environment,
      job.id,
      provider,
    );
    if (!deployment) throw new Error('Failed to create deployment');
    const payload = deploymentJobPayloadSchema.parse({
      deploymentId: deployment.id,
      projectId,
      websiteId: project.websiteId,
      versionId: project.versionId,
      environment: input.environment,
      provider,
    });
    try {
      const queueJobId = await this.queue.add(job.id, payload);
      await this.database.agentJobs.markQueued(
        job.id,
        this.queue.name,
        queueJobId,
      );
    } catch {
      await this.database.agentJobs.markFailed(
        job.id,
        0,
        `Unable to enqueue ${provider} deployment`,
      );
      await this.database.delivery.failDeployment(deployment.id);
      throw new Error(`Unable to enqueue ${provider} deployment`);
    }
    return createDeploymentResponseSchema.parse({
      jobId: job.id,
      deploymentId: deployment.id,
      status: 'PENDING',
    });
  }

  private deploymentProvider(): DeploymentProvider {
    const configured = process.env.DEPLOYMENT_PROVIDER?.trim().toLowerCase();
    if (configured === undefined || configured === '' || configured === 'local')
      return 'local-preview';
    if (configured === 'cloudflare-pages') return configured;
    throw new Error(`Unsupported DEPLOYMENT_PROVIDER: ${configured}`);
  }
  async listDeployments(): Promise<DeploymentListResponse> {
    return deploymentListResponseSchema.parse({
      deployments: (await this.database.delivery.listDeployments()).map(
        toDeployment,
      ),
    });
  }
  async rollback(
    projectId: string,
    request: RollbackDeploymentRequest,
  ): Promise<Deployment> {
    const input = rollbackDeploymentRequestSchema.parse(request);
    const row = await this.database.delivery.rollback(
      projectId,
      input.targetDeploymentId,
    );
    if (!row)
      throw new NotFoundException('Completed target deployment not found');
    return toDeployment(row);
  }
}
