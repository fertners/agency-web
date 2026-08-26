import {
  communicationDraftSchema,
  conversationDetailSchema,
  conversationListResponseSchema,
  createDraftRequestSchema,
  createProposalRequestSchema,
  createProspectNoteRequestSchema,
  draftDecisionRequestSchema,
  proposalDecisionRequestSchema,
  proposalListResponseSchema,
  proposalSchema,
  publicProposalDecisionResponseSchema,
  publicProposalSchema,
  prospectDetailResponseSchema,
  isProspectTransitionAllowed,
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
  type PublicProposalDecisionResponse,
  type ProspectDetailResponse,
  type UpdateProspectStatusRequest,
} from '@ai-web-agency/shared';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { buildCommercialProposalContent } from './proposal-content.js';

function toProposal(row: {
  id: string;
  prospectId: string;
  version: number;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  title: string;
  summary: string;
  message: string;
  analysisIssues: string[];
  previewUrl: string;
  publicToken: string;
  scope: string[];
  priceCents: number;
  currency: string;
  timelineDays: number;
  publishedAt: Date | null;
  expiresAt: Date | null;
  respondedAt: Date | null;
  response: 'ACCEPTED' | 'DECLINED' | null;
  createdAt: Date;
  updatedAt: Date;
}): Proposal {
  const { publicToken, ...publicRow } = row;
  const publicPath = `/proposal/${publicToken}`;
  const dashboardUrl = (
    process.env.PUBLIC_DASHBOARD_URL ?? 'http://127.0.0.1:3000'
  ).replace(/\/$/, '');
  return proposalSchema.parse({
    ...publicRow,
    message: publicRow.message.replace(
      '{PROPOSAL_LINK}',
      `${dashboardUrl}${publicPath}`,
    ),
    publicPath,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

@Injectable()
export class CommercialService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommercialService.name);
  private cleanupTimer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  onModuleInit(): void {
    void this.cleanupExpiredProposals();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredProposals(),
      60 * 60 * 1000,
    );
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer !== undefined) clearInterval(this.cleanupTimer);
  }

  private async cleanupExpiredProposals(): Promise<void> {
    try {
      const deleted = await this.database.commercial.deleteExpiredUnanswered();
      if (deleted > 0)
        this.logger.log(`Deleted ${deleted} expired unanswered prospect(s)`);
    } catch (error) {
      this.logger.error('Unable to run proposal retention cleanup', error);
    }
  }

  async getProspect(id: string): Promise<ProspectDetailResponse> {
    const detail = await this.database.commercial.getProspectDetail(id);
    if (!detail) throw new NotFoundException('Prospect not found');
    return prospectDetailResponseSchema.parse({
      prospect: {
        id: detail.prospect.id,
        companyId: detail.company.id,
        name: detail.company.name,
        category: detail.company.category,
        source: detail.company.source,
        city: detail.company.city,
        countryCode: detail.company.countryCode,
        address:
          [
            detail.company.street,
            detail.company.postalCode,
            detail.company.city,
          ]
            .filter(Boolean)
            .join(', ') || null,
        websiteUrl: detail.company.websiteUrl,
        email: detail.company.email,
        phone: detail.company.phone,
        status: detail.prospect.status,
        opportunityScore: detail.prospect.opportunityScore,
        assessment: detail.prospect.assessment,
        lastAnalyzedAt: detail.prospect.lastAnalyzedAt?.toISOString() ?? null,
        nextAction: detail.prospect.nextAction,
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
    const current = await this.database.commercial.findProspect(id);
    if (!current) throw new NotFoundException('Prospect not found');
    if (
      current.prospect.status !== input.status &&
      !isProspectTransitionAllowed(current.prospect.status, input.status)
    )
      throw new BadRequestException(
        `Transition ${current.prospect.status} → ${input.status} is not allowed`,
      );
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
    if (prospect.prospect.assessment === null)
      throw new BadRequestException(
        'A verified prospect analysis is required before creating a proposal',
      );
    const preview = await this.database.commercial.findLatestPreview(
      prospect.company.id,
    );
    if (preview === undefined)
      throw new BadRequestException(
        'A generated website preview is required before creating a proposal',
      );
    const previewBaseUrl =
      process.env.PREVIEW_BASE_URL ?? 'http://127.0.0.1:3002';
    const previewUrl = `${previewBaseUrl}/preview/${preview.website.id}/${preview.version.id}`;
    const content = buildCommercialProposalContent({
      companyName: prospect.company.name,
      assessment: prospect.prospect.assessment,
      previewUrl,
      ...input,
    });
    const row = await this.database.commercial.createProposal(
      id,
      input,
      content.title,
      content.summary,
      content.message,
      content.issues,
      previewUrl,
    );
    if (!row) throw new Error('Failed to create proposal');
    return toProposal(row);
  }

  async getPublicProposal(token: string): Promise<PublicProposal> {
    const result = await this.database.commercial.findPublicProposal(token);
    if (
      result === undefined ||
      result.proposal.status !== 'APPROVED' ||
      result.proposal.publishedAt === null ||
      result.proposal.expiresAt === null ||
      result.proposal.expiresAt <= new Date()
    )
      throw new NotFoundException('Proposal not found or expired');
    const proposal = toProposal(result.proposal);
    return publicProposalSchema.parse({
      companyName: result.company.name,
      title: proposal.title,
      summary: proposal.summary,
      message: proposal.message,
      analysisIssues: proposal.analysisIssues,
      previewUrl: proposal.previewUrl,
      scope: proposal.scope,
      priceCents: proposal.priceCents,
      currency: proposal.currency,
      timelineDays: proposal.timelineDays,
      expiresAt: proposal.expiresAt,
      response: proposal.response,
    });
  }

  async respondToPublicProposal(
    token: string,
    decision: 'accept' | 'decline',
  ): Promise<PublicProposalDecisionResponse> {
    const result = await this.database.commercial.respondToPublicProposal(
      token,
      decision === 'accept' ? 'ACCEPTED' : 'DECLINED',
    );
    if (result === undefined)
      throw new NotFoundException('Proposal not found, expired or answered');
    return publicProposalDecisionResponseSchema.parse({ decision: result });
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
        companyId: conversation.companyId,
        clientId: conversation.clientId,
        prospectName,
        status: conversation.status,
        intent: conversation.intent,
        priority: conversation.priority,
        unreadCount: conversation.unreadCount,
        summary: conversation.summary,
        recommendedAction: conversation.recommendedAction,
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

  async getConversation(id: string): Promise<ConversationDetail> {
    const row = await this.database.commercial.getConversation(id);
    if (!row) throw new NotFoundException('Conversation not found');
    const base = {
      id: row.conversation.id,
      prospectId: row.conversation.prospectId,
      companyId: row.conversation.companyId,
      clientId: row.conversation.clientId,
      prospectName: row.prospectName,
      status: row.conversation.status,
      intent: row.conversation.intent,
      priority: row.conversation.priority,
      unreadCount: row.conversation.unreadCount,
      summary: row.conversation.summary,
      recommendedAction: row.conversation.recommendedAction,
      drafts: row.drafts.map((draft) => ({
        ...draft,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      })),
      messages: row.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        body: message.body,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      })),
      createdAt: row.conversation.createdAt.toISOString(),
      updatedAt: row.conversation.updatedAt.toISOString(),
    };
    return conversationDetailSchema.parse(base);
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
