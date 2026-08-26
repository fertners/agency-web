import { z } from 'zod';
import { prospectStatusSchema } from './prospects.js';

export const proposalStatusSchema = z.enum([
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
]);
export const proposalResponseSchema = z.enum(['ACCEPTED', 'DECLINED']);
export const conversationStatusSchema = z.enum([
  'UNREAD',
  'OPEN',
  'WAITING',
  'REPLIED',
  'CLOSED',
]);
export const conversationIntentSchema = z.enum([
  'QUESTION',
  'PRICE',
  'DESIGN_REQUEST',
  'SEO_REQUEST',
  'INTERESTED',
  'NOT_INTERESTED',
  'SUPPORT',
  'OTHER',
]);
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
    message: z.string(),
    analysisIssues: z.array(z.string()),
    previewUrl: z.url(),
    publicPath: z.string().startsWith('/proposal/'),
    scope: z.array(z.string()),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    timelineDays: z.number().int().positive(),
    publishedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime().nullable(),
    respondedAt: z.iso.datetime().nullable(),
    response: proposalResponseSchema.nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const publicProposalSchema = proposalSchema
  .pick({
    title: true,
    summary: true,
    message: true,
    analysisIssues: true,
    previewUrl: true,
    scope: true,
    priceCents: true,
    currency: true,
    timelineDays: true,
    expiresAt: true,
    response: true,
  })
  .extend({ companyName: z.string() })
  .strict();
export const publicProposalDecisionSchema = z
  .object({ decision: z.enum(['accept', 'decline']) })
  .strict();
export const publicProposalDecisionResponseSchema = z
  .object({ decision: proposalResponseSchema })
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
export const conversationMessageSchema = z
  .object({
    id: z.uuid(),
    direction: z.enum(['INBOUND', 'OUTBOUND', 'INTERNAL']),
    body: z.string(),
    isRead: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const conversationSchema = z
  .object({
    id: z.uuid(),
    prospectId: z.uuid(),
    companyId: z.uuid().nullable(),
    clientId: z.uuid().nullable(),
    prospectName: z.string(),
    status: conversationStatusSchema,
    intent: conversationIntentSchema.nullable(),
    priority: z.number().int(),
    unreadCount: z.number().int().nonnegative(),
    summary: z.string().nullable(),
    recommendedAction: z.string().nullable(),
    drafts: z.array(communicationDraftSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const conversationDetailSchema = conversationSchema.extend({
  messages: z.array(conversationMessageSchema),
});
export const prospectDetailResponseSchema = z
  .object({
    prospect: z.object({
      id: z.uuid(),
      companyId: z.uuid(),
      name: z.string(),
      category: z.string(),
      source: z.string(),
      city: z.string(),
      countryCode: z.string().length(2),
      address: z.string().nullable(),
      websiteUrl: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      status: prospectStatusSchema,
      opportunityScore: z.number().int().nullable(),
      assessment: z
        .object({
          score: z.number().int().min(0).max(100),
          components: z.object({
            websiteQuality: z.number().int().min(0).max(100),
            mobile: z.number().int().min(0).max(100),
            seo: z.number().int().min(0).max(100),
            businessQuality: z.number().int().min(0).max(100),
            missingFeatures: z.number().int().min(0).max(100),
            contactability: z.number().int().min(0).max(100),
          }),
          summary: z.string(),
          evidence: z.array(z.string()),
        })
        .nullable(),
      lastAnalyzedAt: z.iso.datetime().nullable(),
      nextAction: z.string().nullable(),
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
export type PublicProposal = z.infer<typeof publicProposalSchema>;
export type PublicProposalDecision = z.infer<
  typeof publicProposalDecisionSchema
>;
export type PublicProposalDecisionResponse = z.infer<
  typeof publicProposalDecisionResponseSchema
>;
export type ProposalListResponse = z.infer<typeof proposalListResponseSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;
export type ConversationListResponse = z.infer<
  typeof conversationListResponseSchema
>;
export type CommunicationDraft = z.infer<typeof communicationDraftSchema>;
