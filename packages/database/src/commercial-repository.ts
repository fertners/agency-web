import type {
  CreateDraftRequest,
  CreateProposalRequest,
  ProspectStatus,
} from '@ai-web-agency/shared';
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, isNull, lt, max } from 'drizzle-orm';
import type { Database } from './client.js';
import { hashContactIdentity } from './contact-identity.js';
import {
  clients,
  communicationDrafts,
  companies,
  contactSuppressions,
  conversationMessages,
  conversations,
  proposals,
  prospectNotes,
  prospects,
  prospectStatusHistory,
  websites,
  websiteVersions,
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
    message: string,
    analysisIssues: string[],
    previewUrl: string,
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
          message,
          analysisIssues,
          previewUrl,
          publicToken: randomBytes(32).toString('base64url'),
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
    const now = new Date();
    const [row] = await this.database
      .update(proposals)
      .set({
        status,
        publishedAt: status === 'APPROVED' ? now : null,
        expiresAt:
          status === 'APPROVED'
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null,
        updatedAt: now,
      })
      .where(eq(proposals.id, id))
      .returning();
    return row;
  }

  async findLatestPreview(companyId: string) {
    const [row] = await this.database
      .select({ website: websites, version: websiteVersions })
      .from(websites)
      .innerJoin(websiteVersions, eq(websiteVersions.websiteId, websites.id))
      .where(eq(websites.companyId, companyId))
      .orderBy(desc(websiteVersions.version))
      .limit(1);
    return row;
  }

  async findPublicProposal(token: string) {
    const [row] = await this.database
      .select({ proposal: proposals, company: companies })
      .from(proposals)
      .innerJoin(prospects, eq(proposals.prospectId, prospects.id))
      .innerJoin(companies, eq(prospects.companyId, companies.id))
      .where(eq(proposals.publicToken, token));
    return row;
  }

  async respondToPublicProposal(
    token: string,
    decision: 'ACCEPTED' | 'DECLINED',
  ) {
    return this.database.transaction(async (tx) => {
      const [source] = await tx
        .select({
          proposal: proposals,
          prospect: prospects,
          company: companies,
        })
        .from(proposals)
        .innerJoin(prospects, eq(proposals.prospectId, prospects.id))
        .innerJoin(companies, eq(prospects.companyId, companies.id))
        .where(eq(proposals.publicToken, token))
        .for('update');
      if (
        source === undefined ||
        source.proposal.status !== 'APPROVED' ||
        source.proposal.response !== null ||
        source.proposal.expiresAt === null ||
        source.proposal.expiresAt <= new Date()
      )
        return undefined;

      const now = new Date();
      if (decision === 'ACCEPTED') {
        await tx
          .update(proposals)
          .set({ response: decision, respondedAt: now, updatedAt: now })
          .where(eq(proposals.id, source.proposal.id));
        if (source.prospect.status !== 'INTERESTED') {
          await tx.insert(prospectStatusHistory).values({
            prospectId: source.prospect.id,
            fromStatus: source.prospect.status,
            toStatus: 'INTERESTED',
            note: 'Proposition acceptée depuis le lien public',
          });
          await tx
            .update(prospects)
            .set({ status: 'INTERESTED', updatedAt: now })
            .where(eq(prospects.id, source.prospect.id));
        }
        return decision;
      }

      const [client] = await tx
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.companyId, source.company.id));
      if (client !== undefined) return undefined;
      await tx
        .insert(contactSuppressions)
        .values({
          identityHash: hashContactIdentity(source.company.fingerprint),
          reason: 'OPT_OUT',
          retainUntil: new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing({ target: contactSuppressions.identityHash });
      await tx.delete(companies).where(eq(companies.id, source.company.id));
      return decision;
    });
  }

  async deleteExpiredUnanswered(now = new Date()): Promise<number> {
    return this.database.transaction(async (tx) => {
      const rows = await tx
        .select({ companyId: companies.id })
        .from(proposals)
        .innerJoin(prospects, eq(proposals.prospectId, prospects.id))
        .innerJoin(companies, eq(prospects.companyId, companies.id))
        .where(and(isNull(proposals.response), lt(proposals.expiresAt, now)));
      let deleted = 0;
      for (const companyId of new Set(rows.map((row) => row.companyId))) {
        const [client] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.companyId, companyId));
        if (client === undefined) {
          await tx.delete(companies).where(eq(companies.id, companyId));
          deleted += 1;
        }
      }
      return deleted;
    });
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

  async getConversation(id: string) {
    const [root] = await this.database
      .select({ conversation: conversations, prospectName: companies.name })
      .from(conversations)
      .innerJoin(prospects, eq(conversations.prospectId, prospects.id))
      .innerJoin(companies, eq(prospects.companyId, companies.id))
      .where(eq(conversations.id, id));
    if (!root) return undefined;
    const [drafts, messages] = await Promise.all([
      this.database
        .select()
        .from(communicationDrafts)
        .where(eq(communicationDrafts.conversationId, id))
        .orderBy(asc(communicationDrafts.createdAt)),
      this.database
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, id))
        .orderBy(asc(conversationMessages.createdAt)),
    ]);
    return { ...root, drafts, messages };
  }
}
