import { z } from 'zod';

import { createProposalRequestSchema } from './commercial.js';
import { websiteIdSchema, websiteVersionIdSchema } from './websites.js';

export const prospectWorkflowRequestSchema = createProposalRequestSchema;
export const prospectWorkflowJobPayloadSchema = createProposalRequestSchema
  .extend({ prospectId: z.uuid() })
  .strict();
export const prospectWorkflowJobResultSchema = z
  .object({
    prospectId: z.uuid(),
    websiteId: websiteIdSchema,
    versionId: websiteVersionIdSchema,
    proposalId: z.uuid(),
    proposalStatus: z.literal('NEEDS_REVIEW'),
  })
  .strict();
export const createProspectWorkflowResponseSchema = z
  .object({ jobId: z.uuid(), status: z.literal('PENDING') })
  .strict();

export type ProspectWorkflowRequest = z.infer<
  typeof prospectWorkflowRequestSchema
>;
export type ProspectWorkflowJobPayload = z.infer<
  typeof prospectWorkflowJobPayloadSchema
>;
export type ProspectWorkflowJobResult = z.infer<
  typeof prospectWorkflowJobResultSchema
>;
export type CreateProspectWorkflowResponse = z.infer<
  typeof createProspectWorkflowResponseSchema
>;
