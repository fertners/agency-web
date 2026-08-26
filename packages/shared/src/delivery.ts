import { z } from 'zod';

export const clientStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const projectStatusSchema = z.enum([
  'PLANNED',
  'ACTIVE',
  'DELIVERED',
  'ARCHIVED',
]);
export const deploymentEnvironmentSchema = z.enum(['PREVIEW', 'PRODUCTION']);
export const deploymentStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'ROLLED_BACK',
]);

export const convertProspectRequestSchema = z
  .object({ proposalId: z.uuid() })
  .strict();
export const attachProjectWebsiteRequestSchema = z
  .object({ websiteId: z.uuid(), versionId: z.uuid() })
  .strict();
export const createDeploymentRequestSchema = z
  .object({ environment: deploymentEnvironmentSchema.default('PREVIEW') })
  .strict();
export const rollbackDeploymentRequestSchema = z
  .object({ targetDeploymentId: z.uuid() })
  .strict();

export const clientSchema = z
  .object({
    id: z.uuid(),
    prospectId: z.uuid(),
    name: z.string(),
    status: clientStatusSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const projectSchema = z
  .object({
    id: z.uuid(),
    clientId: z.uuid(),
    proposalId: z.uuid(),
    name: z.string(),
    status: projectStatusSchema,
    websiteId: z.uuid().nullable(),
    versionId: z.uuid().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const deploymentSchema = z
  .object({
    id: z.uuid(),
    projectId: z.uuid(),
    websiteId: z.uuid(),
    versionId: z.uuid(),
    agentJobId: z.uuid().nullable(),
    environment: deploymentEnvironmentSchema,
    status: deploymentStatusSchema,
    provider: z.literal('local-preview'),
    url: z.url().nullable(),
    isActive: z.boolean(),
    replacesDeploymentId: z.uuid().nullable(),
    error: z.string().nullable(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();
export const clientDetailSchema = z
  .object({ client: clientSchema, projects: z.array(projectSchema) })
  .strict();
export const convertProspectResponseSchema = z
  .object({ client: clientSchema, project: projectSchema })
  .strict();
export const clientListResponseSchema = z
  .object({ clients: z.array(clientSchema) })
  .strict();
export const projectListResponseSchema = z
  .object({ projects: z.array(projectSchema) })
  .strict();
export const deploymentListResponseSchema = z
  .object({ deployments: z.array(deploymentSchema) })
  .strict();
export const createDeploymentResponseSchema = z
  .object({
    jobId: z.uuid(),
    deploymentId: z.uuid(),
    status: z.literal('PENDING'),
  })
  .strict();
export const deploymentJobPayloadSchema = z
  .object({
    deploymentId: z.uuid(),
    projectId: z.uuid(),
    websiteId: z.uuid(),
    versionId: z.uuid(),
    environment: deploymentEnvironmentSchema,
  })
  .strict();
export const deploymentJobResultSchema = z
  .object({
    deploymentId: z.uuid(),
    url: z.url(),
    status: z.literal('COMPLETED'),
  })
  .strict();

export type ConvertProspectRequest = z.infer<
  typeof convertProspectRequestSchema
>;
export type AttachProjectWebsiteRequest = z.infer<
  typeof attachProjectWebsiteRequestSchema
>;
export type CreateDeploymentRequest = z.infer<
  typeof createDeploymentRequestSchema
>;
export type RollbackDeploymentRequest = z.infer<
  typeof rollbackDeploymentRequestSchema
>;
export type Client = z.infer<typeof clientSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Deployment = z.infer<typeof deploymentSchema>;
export type DeploymentEnvironment = z.infer<typeof deploymentEnvironmentSchema>;
export type ClientDetail = z.infer<typeof clientDetailSchema>;
export type ClientListResponse = z.infer<typeof clientListResponseSchema>;
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
export type DeploymentListResponse = z.infer<
  typeof deploymentListResponseSchema
>;
export type CreateDeploymentResponse = z.infer<
  typeof createDeploymentResponseSchema
>;
export type DeploymentJobPayload = z.infer<typeof deploymentJobPayloadSchema>;
export type DeploymentJobResult = z.infer<typeof deploymentJobResultSchema>;
