import type {
  CreateDraftRequest,
  CreateProposalRequest,
  ProspectStatus,
} from '@ai-web-agency/shared';
import { asc, desc, eq, max } from 'drizzle-orm';
import type { Database } from './client.js';
import {
  communicationDrafts,
  companies,
  conversations,
  proposals,
  prospectNotes,
  prospects,
  prospectStatusHistory,
} from './schema/index.js';

export class CommercialRepository {
  constructor(private readonly database: Database) {}

  async findProspect(id: string) {
    const [row] = await this.database
      .select({ prospect: prospects, company: companies })
      .from(prospects)
      .innerJoin(companies, eq(prospects.companyId, companies.id))
      .where(eq(prospects.id, id));
    return row;
  }

  async getProspectDetail(id: string) {
    const prospect = await this.findProspect(id);
    if (!prospect) return undefined;
    const [history, notes, proposalRows] = await Promise.all([
      this.database
        .select()
        .from(prospectStatusHistory)
        .where(eq(prospectStatusHistory.prospectId, id))
        .orderBy(desc(prospectStatusHistory.createdAt)),
      this.database
        .select()
        .from(prospectNotes)
        .where(eq(prospectNotes.prospectId, id))
        .orderBy(desc(prospectNotes.createdAt)),
      this.database
        .select()
        .from(proposals)
        .where(eq(proposals.prospectId, id))
        .orderBy(desc(proposals.version)),
    ]);
    return { ...prospect, history, notes, proposals: proposalRows };
  }

  async updateProspectStatus(
    id: string,
    status: ProspectStatus,
    note?: string,
  ) {
    return this.database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(prospects)
        .where(eq(prospects.id, id));
      if (!current) return undefined;
      if (current.status !== status) {
        await tx.insert(prospectStatusHistory).values({
          prospectId: id,
          fromStatus: current.status,
          toStatus: status,
          note,
        });
        await tx
          .update(prospects)
          .set({ status, updatedAt: new Date() })
          .where(eq(prospects.id, id));
      }
      return { ...current, status };
    });
  }

  async addNote(prospectId: string, content: string) {
    const [row] = await this.database
      .insert(prospectNotes)
      .values({ prospectId, content })
      .returning();
    return row;
  }

  async createProposal(
    prospectId: string,
    input: CreateProposalRequest,
    title: string,
    summary: string,
  ) {
    return this.database.transaction(async (tx) => {
      const [versionRow] = await tx
        .select({ value: max(proposals.version) })
        .from(proposals)
        .where(eq(proposals.prospectId, prospectId));
      const [row] = await tx
        .insert(proposals)
        .values({
          prospectId,
          version: (versionRow?.value ?? 0) + 1,
          status: 'NEEDS_REVIEW',
          title,
          summary,
          scope: input.scope,
          priceCents: input.priceCents,
          currency: input.currency,
          timelineDays: input.timelineDays,
        })
        .returning();
      return row;
    });
  }

  listProposals() {
    return this.database
      .select()
      .from(proposals)
      .orderBy(desc(proposals.updatedAt));
  }

  async decideProposal(id: string, status: 'APPROVED' | 'REJECTED') {
    const [row] = await this.database
      .update(proposals)
      .set({ status, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return row;
  }

  async createDraft(
    prospectId: string,
    input: CreateDraftRequest,
    subject: string | undefined,
    body: string,
  ) {
    return this.database.transaction(async (tx) => {
      const [conversation] = await tx
        .insert(conversations)
        .values({ prospectId })
        .onConflictDoUpdate({
          target: conversations.prospectId,
          set: { status: 'OPEN', updatedAt: new Date() },
        })
        .returning();
      if (!conversation) throw new Error('Failed to persist conversation');
      const [draft] = await tx
        .insert(communicationDrafts)
        .values({
          conversationId: conversation.id,
          channel: input.channel,
          subject,
          body,
        })
        .returning();
      return draft;
    });
  }

  async decideDraft(id: string, status: 'APPROVED' | 'REJECTED') {
    const [row] = await this.database
      .update(communicationDrafts)
      .set({ status, updatedAt: new Date() })
      .where(eq(communicationDrafts.id, id))
      .returning();
    return row;
  }

  async listConversations() {
    const roots = await this.database
      .select({ conversation: conversations, prospectName: companies.name })
      .from(conversations)
      .innerJoin(prospects, eq(conversations.prospectId, prospects.id))
      .innerJoin(companies, eq(prospects.companyId, companies.id))
      .orderBy(desc(conversations.updatedAt));
    return Promise.all(
      roots.map(async (root) => ({
        ...root,
        drafts: await this.database
          .select()
          .from(communicationDrafts)
          .where(eq(communicationDrafts.conversationId, root.conversation.id))
          .orderBy(asc(communicationDrafts.createdAt)),
      })),
    );
  }
}
