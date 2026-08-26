import { z } from 'zod';

export const AGENT_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'NEEDS_REVIEW',
] as const;

export const agentJobStatusSchema = z.enum(AGENT_JOB_STATUSES);

export const agentJobIdSchema = z.uuid();

export const diagnosticJobPayloadSchema = z
  .object({
    requestedAt: z.iso.datetime(),
    correlationId: z.uuid().optional(),
  })
  .strict();

export const createDiagnosticJobRequestSchema = z
  .object({
    correlationId: z.uuid().optional(),
  })
  .strict();

export const createDiagnosticJobResponseSchema = z
  .object({
    jobId: agentJobIdSchema,
    status: z.literal('PENDING'),
  })
  .strict();

export const agentJobResponseSchema = z
  .object({
    jobId: agentJobIdSchema,
    type: z.string().trim().min(1),
    status: agentJobStatusSchema,
    attempt: z.number().int().nonnegative(),
    output: z.record(z.string(), z.unknown()).nullable(),
    error: z.string().nullable(),
    createdAt: z.iso.datetime(),
    startedAt: z.iso.datetime().nullable(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();

export const agentJobListResponseSchema = z
  .object({
    jobs: z.array(agentJobResponseSchema),
  })
  .strict();

export type AgentJobStatus = z.infer<typeof agentJobStatusSchema>;
export type AgentJobId = z.infer<typeof agentJobIdSchema>;
export type DiagnosticJobPayload = z.infer<typeof diagnosticJobPayloadSchema>;
export type CreateDiagnosticJobRequest = z.infer<
  typeof createDiagnosticJobRequestSchema
>;
export type CreateDiagnosticJobResponse = z.infer<
  typeof createDiagnosticJobResponseSchema
>;
export type AgentJobResponse = z.infer<typeof agentJobResponseSchema>;
export type AgentJobListResponse = z.infer<typeof agentJobListResponseSchema>;
