import {
  createDraftRequestSchema,
  createProposalRequestSchema,
  createProspectNoteRequestSchema,
  draftDecisionRequestSchema,
  proposalDecisionRequestSchema,
  publicProposalDecisionSchema,
  updateProspectStatusRequestSchema,
  type CommunicationDraft,
  type ConversationDetail,
  type ConversationListResponse,
  type CreateDraftRequest,
  type CreateProposalRequest,
  type CreateProspectNoteRequest,
  type DraftDecisionRequest,
  type Proposal,
  type ProposalDecisionRequest,
  type ProposalListResponse,
  type PublicProposal,
  type PublicProposalDecision,
  type PublicProposalDecisionResponse,
  type ProspectDetailResponse,
  type UpdateProspectStatusRequest,
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
import { CommercialService } from './commercial.service.js';

const uuidSchema = z.uuid();
const publicTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

@Controller()
export class CommercialController {
  constructor(
    @Inject(CommercialService) private readonly service: CommercialService,
  ) {}

  @Get('prospects/:id') getProspect(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<ProspectDetailResponse> {
    return this.service.getProspect(id);
  }
  @Patch('prospects/:id/status') updateStatus(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateProspectStatusRequestSchema))
    request: UpdateProspectStatusRequest,
  ): Promise<ProspectDetailResponse> {
    return this.service.updateStatus(id, request);
  }
  @Post('prospects/:id/notes') addNote(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createProspectNoteRequestSchema))
    request: CreateProspectNoteRequest,
  ): Promise<ProspectDetailResponse> {
    return this.service.addNote(id, request);
  }
  @Post('prospects/:id/proposals') createProposal(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createProposalRequestSchema))
    request: CreateProposalRequest,
  ): Promise<Proposal> {
    return this.service.createProposal(id, request);
  }
  @Post('prospects/:id/conversations/drafts') createDraft(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createDraftRequestSchema))
    request: CreateDraftRequest,
  ): Promise<CommunicationDraft> {
    return this.service.createDraft(id, request);
  }
  @Get('proposals') listProposals(): Promise<ProposalListResponse> {
    return this.service.listProposals();
  }
  @Post('proposals/:id/decision') decideProposal(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(proposalDecisionRequestSchema))
    request: ProposalDecisionRequest,
  ): Promise<Proposal> {
    return this.service.decideProposal(id, request);
  }
  @Get('public/proposals/:token') getPublicProposal(
    @Param('token', new ZodValidationPipe(publicTokenSchema)) token: string,
  ): Promise<PublicProposal> {
    return this.service.getPublicProposal(token);
  }
  @Post('public/proposals/:token/respond') respondToPublicProposal(
    @Param('token', new ZodValidationPipe(publicTokenSchema)) token: string,
    @Body(new ZodValidationPipe(publicProposalDecisionSchema))
    request: PublicProposalDecision,
  ): Promise<PublicProposalDecisionResponse> {
    return this.service.respondToPublicProposal(token, request.decision);
  }
  @Get('conversations') listConversations(): Promise<ConversationListResponse> {
    return this.service.listConversations();
  }
  @Get('conversations/:id') getConversation(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<ConversationDetail> {
    return this.service.getConversation(id);
  }
  @Post('conversations/drafts/:id/decision') decideDraft(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(draftDecisionRequestSchema))
    request: DraftDecisionRequest,
  ): Promise<CommunicationDraft> {
    return this.service.decideDraft(id, request);
  }
}
