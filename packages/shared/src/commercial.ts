import { z } from 'zod';
import { prospectStatusSchema } from './prospects.js';

export const proposalStatusSchema = z.enum([
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
]);
export const conversationStatusSchema = z.enum(['OPEN', 'CLOSED']);
export const communicationChannelSchema = z.enum([
  'EMAIL',
  'PHONE_NOTE',
  'MANUAL',
]);
export const draftStatusSchema = z.enum(['DRAFT', 'APPROVED', 'REJECTED']);

export const updateProspectStatusRequestSchema = z
  .object({
    status: prospectStatusSchema,
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();
export const createProspectNoteRequestSchema = z
  .object({ content: z.string().trim().min(1).max(5000) })
  .strict();
export const createProposalRequestSchema = z
  .object({
    priceCents: z.coerce.number().int().min(0).max(100_000_000),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
    timelineDays: z.coerce.number().int().min(1).max(365),
    scope: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
  })
  .strict();
export const proposalDecisionRequestSchema = z
  .object({ decision: z.enum(['approve', 'reject']) })
  .strict();
export const createDraftRequestSchema = z
  .object({ channel: communicationChannelSchema.default('EMAIL') })
  .strict();
export const draftDecisionRequestSchema = proposalDecisionRequestSchema;

export const prospectHistoryItemSchema = z
  .object({
    id: z.uuid(),
    fromStatus: prospectStatusSchema.nullable(),
    toStatus: prospectStatusSchema,
    note: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const prospectNoteSchema = z
  .object({ id: z.uuid(), content: z.string(), createdAt: z.iso.datetime() })
  .strict();
export const proposalSchema = z
  .object({
    id: z.uuid(),
    prospectId: z.uuid(),
    version: z.number().int().positive(),
    status: proposalStatusSchema,
    title: z.string(),
    summary: z.string(),
    scope: z.array(z.string()),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    timelineDays: z.number().int().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const communicationDraftSchema = z
  .object({
    id: z.uuid(),
    conversationId: z.uuid(),
    channel: communicationChannelSchema,
    status: draftStatusSchema,
    subject: z.string().nullable(),
    body: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const conversationSchema = z
  .object({
    id: z.uuid(),
    prospectId: z.uuid(),
    prospectName: z.string(),
    status: conversationStatusSchema,
    drafts: z.array(communicationDraftSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const prospectDetailResponseSchema = z
  .object({
    prospect: z.object({
      id: z.uuid(),
      companyId: z.uuid(),
      name: z.string(),
      source: z.string(),
      city: z.string(),
      countryCode: z.string().length(2),
      websiteUrl: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      status: prospectStatusSchema,
      opportunityScore: z.number().int().nullable(),
    }),
    history: z.array(prospectHistoryItemSchema),
    notes: z.array(prospectNoteSchema),
    proposals: z.array(proposalSchema),
  })
  .strict();
export const proposalListResponseSchema = z
  .object({ proposals: z.array(proposalSchema) })
  .strict();
export const conversationListResponseSchema = z
  .object({ conversations: z.array(conversationSchema) })
  .strict();

export type UpdateProspectStatusRequest = z.infer<
  typeof updateProspectStatusRequestSchema
>;
export type CreateProspectNoteRequest = z.infer<
  typeof createProspectNoteRequestSchema
>;
export type CreateProposalRequest = z.infer<typeof createProposalRequestSchema>;
export type ProposalDecisionRequest = z.infer<
  typeof proposalDecisionRequestSchema
>;
export type CreateDraftRequest = z.infer<typeof createDraftRequestSchema>;
export type DraftDecisionRequest = z.infer<typeof draftDecisionRequestSchema>;
export type ProspectDetailResponse = z.infer<
  typeof prospectDetailResponseSchema
>;
export type Proposal = z.infer<typeof proposalSchema>;
export type ProposalListResponse = z.infer<typeof proposalListResponseSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationListResponse = z.infer<
  typeof conversationListResponseSchema
>;
export type CommunicationDraft = z.infer<typeof communicationDraftSchema>;
