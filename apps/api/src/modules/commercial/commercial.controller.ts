import {
  createDraftRequestSchema,
  createProposalRequestSchema,
  createProspectNoteRequestSchema,
  draftDecisionRequestSchema,
  proposalDecisionRequestSchema,
  updateProspectStatusRequestSchema,
  type CommunicationDraft,
  type ConversationListResponse,
  type CreateDraftRequest,
  type CreateProposalRequest,
  type CreateProspectNoteRequest,
  type DraftDecisionRequest,
  type Proposal,
  type ProposalDecisionRequest,
  type ProposalListResponse,
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
  @Get('conversations') listConversations(): Promise<ConversationListResponse> {
    return this.service.listConversations();
  }
  @Post('conversations/drafts/:id/decision') decideDraft(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(draftDecisionRequestSchema))
    request: DraftDecisionRequest,
  ): Promise<CommunicationDraft> {
    return this.service.decideDraft(id, request);
  }
}
