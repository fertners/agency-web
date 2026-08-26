import {
  communicationDraftSchema,
  conversationListResponseSchema,
  createDraftRequestSchema,
  createProposalRequestSchema,
  createProspectNoteRequestSchema,
  draftDecisionRequestSchema,
  proposalDecisionRequestSchema,
  proposalListResponseSchema,
  proposalSchema,
  prospectDetailResponseSchema,
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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';

function toProposal(row: {
  id: string;
  prospectId: string;
  version: number;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  title: string;
  summary: string;
  scope: string[];
  priceCents: number;
  currency: string;
  timelineDays: number;
  createdAt: Date;
  updatedAt: Date;
}): Proposal {
  return proposalSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

@Injectable()
export class CommercialService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async getProspect(id: string): Promise<ProspectDetailResponse> {
    const detail = await this.database.commercial.getProspectDetail(id);
    if (!detail) throw new NotFoundException('Prospect not found');
    return prospectDetailResponseSchema.parse({
      prospect: {
        id: detail.prospect.id,
        companyId: detail.company.id,
        name: detail.company.name,
        source: detail.company.source,
        city: detail.company.city,
        countryCode: detail.company.countryCode,
        websiteUrl: detail.company.websiteUrl,
        email: detail.company.email,
        phone: detail.company.phone,
        status: detail.prospect.status,
        opportunityScore: detail.prospect.opportunityScore,
      },
      history: detail.history.map((row) => ({
        id: row.id,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      })),
      notes: detail.notes.map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })),
      proposals: detail.proposals.map(toProposal),
    });
  }

  async updateStatus(
    id: string,
    request: UpdateProspectStatusRequest,
  ): Promise<ProspectDetailResponse> {
    const input = updateProspectStatusRequestSchema.parse(request);
    const updated = await this.database.commercial.updateProspectStatus(
      id,
      input.status,
      input.note,
    );
    if (!updated) throw new NotFoundException('Prospect not found');
    return this.getProspect(id);
  }

  async addNote(
    id: string,
    request: CreateProspectNoteRequest,
  ): Promise<ProspectDetailResponse> {
    const input = createProspectNoteRequestSchema.parse(request);
    if (!(await this.database.commercial.findProspect(id)))
      throw new NotFoundException('Prospect not found');
    await this.database.commercial.addNote(id, input.content);
    return this.getProspect(id);
  }

  async createProposal(
    id: string,
    request: CreateProposalRequest,
  ): Promise<Proposal> {
    const input = createProposalRequestSchema.parse(request);
    const prospect = await this.database.commercial.findProspect(id);
    if (!prospect) throw new NotFoundException('Prospect not found');
    const title = `Refonte du site de ${prospect.company.name}`;
    const summary = `Proposition structurée pour améliorer la présence numérique de ${prospect.company.name}. Validation humaine requise avant toute communication.`;
    const row = await this.database.commercial.createProposal(
      id,
      input,
      title,
      summary,
    );
    if (!row) throw new Error('Failed to create proposal');
    return toProposal(row);
  }

  async listProposals(): Promise<ProposalListResponse> {
    const rows = await this.database.commercial.listProposals();
    return proposalListResponseSchema.parse({
      proposals: rows.map(toProposal),
    });
  }

  async decideProposal(
    id: string,
    request: ProposalDecisionRequest,
  ): Promise<Proposal> {
    const input = proposalDecisionRequestSchema.parse(request);
    const row = await this.database.commercial.decideProposal(
      id,
      input.decision === 'approve' ? 'APPROVED' : 'REJECTED',
    );
    if (!row) throw new NotFoundException('Proposal not found');
    return toProposal(row);
  }

  async createDraft(
    id: string,
    request: CreateDraftRequest,
  ): Promise<CommunicationDraft> {
    const input = createDraftRequestSchema.parse(request);
    const prospect = await this.database.commercial.findProspect(id);
    if (!prospect) throw new NotFoundException('Prospect not found');
    const subject =
      input.channel === 'EMAIL'
        ? `Une piste d’amélioration pour ${prospect.company.name}`
        : undefined;
    const body = `Bonjour,\n\nNous avons remarqué le potentiel numérique de ${prospect.company.name}. Nous avons préparé quelques pistes concrètes pour améliorer sa présence en ligne.\n\nCe brouillon doit être relu et personnalisé par un humain avant toute utilisation.\n\nCordialement`;
    const row = await this.database.commercial.createDraft(
      id,
      input,
      subject,
      body,
    );
    if (!row) throw new Error('Failed to create draft');
    return communicationDraftSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async listConversations(): Promise<ConversationListResponse> {
    const rows = await this.database.commercial.listConversations();
    return conversationListResponseSchema.parse({
      conversations: rows.map(({ conversation, prospectName, drafts }) => ({
        id: conversation.id,
        prospectId: conversation.prospectId,
        prospectName,
        status: conversation.status,
        drafts: drafts.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      })),
    });
  }

  async decideDraft(
    id: string,
    request: DraftDecisionRequest,
  ): Promise<CommunicationDraft> {
    const input = draftDecisionRequestSchema.parse(request);
    const row = await this.database.commercial.decideDraft(
      id,
      input.decision === 'approve' ? 'APPROVED' : 'REJECTED',
    );
    if (!row) throw new NotFoundException('Draft not found');
    return communicationDraftSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
