import type { DeploymentEnvironment } from '@ai-web-agency/shared';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from './client.js';
import {
  clients,
  clientRequests,
  companies,
  conversations,
  deployments,
  projects,
  payments,
  proposals,
  prospects,
  prospectStatusHistory,
  websiteVersions,
} from './schema/index.js';

export class DeliveryRepository {
  constructor(private readonly database: Database) {}

  convertProspect(prospectId: string, proposalId: string) {
    return this.database.transaction(async (tx) => {
      const [source] = await tx
        .select({
          prospect: prospects,
          company: companies,
          proposal: proposals,
        })
        .from(prospects)
        .innerJoin(companies, eq(prospects.companyId, companies.id))
        .innerJoin(
          proposals,
          and(
            eq(proposals.prospectId, prospects.id),
            eq(proposals.id, proposalId),
          ),
        )
        .where(
          and(eq(prospects.id, prospectId), eq(proposals.status, 'APPROVED')),
        );
      if (!source) return undefined;
      const [client] = await tx
        .insert(clients)
        .values({
          prospectId,
          companyId: source.company.id,
          name: source.company.name,
        })
        .onConflictDoUpdate({
          target: clients.prospectId,
          set: {
            name: source.company.name,
            companyId: source.company.id,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!client) throw new Error('Failed to persist client');
      const [project] = await tx
        .insert(projects)
        .values({
          clientId: client.id,
          proposalId,
          name: source.proposal.title,
        })
        .onConflictDoUpdate({
          target: projects.proposalId,
          set: {
            clientId: client.id,
            name: source.proposal.title,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!project) throw new Error('Failed to persist project');
      if (!['CONVERTED', 'WON'].includes(source.prospect.status)) {
        await tx.insert(prospectStatusHistory).values({
          prospectId,
          fromStatus: source.prospect.status,
          toStatus: 'WON',
          note: 'Converted from an approved proposal',
        });
        await tx
          .update(prospects)
          .set({ status: 'WON', updatedAt: new Date() })
          .where(eq(prospects.id, prospectId));
      }
      return { client, project };
    });
  }

  listClients() {
    return this.database
      .select()
      .from(clients)
      .orderBy(desc(clients.updatedAt));
  }
  listProjects() {
    return this.database
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt));
  }

  async getClientDetail(id: string) {
    const [client] = await this.database
      .select()
      .from(clients)
      .where(eq(clients.id, id));
    if (!client) return undefined;
    const [projectRows, paymentRows, requestRows, conversationRows] =
      await Promise.all([
        this.database.select().from(projects).where(eq(projects.clientId, id)),
        this.database.select().from(payments).where(eq(payments.clientId, id)),
        this.database
          .select()
          .from(clientRequests)
          .where(eq(clientRequests.clientId, id)),
        client.companyId
          ? this.database
              .select({ id: conversations.id })
              .from(conversations)
              .where(eq(conversations.companyId, client.companyId))
          : [],
      ]);
    return {
      client,
      projects: projectRows,
      payments: paymentRows,
      requests: requestRows,
      conversationIds: conversationRows.map((row) => row.id),
    };
  }

  async attachWebsite(projectId: string, websiteId: string, versionId: string) {
    const [version] = await this.database
      .select()
      .from(websiteVersions)
      .where(
        and(
          eq(websiteVersions.id, versionId),
          eq(websiteVersions.websiteId, websiteId),
          eq(websiteVersions.status, 'APPROVED'),
        ),
      );
    if (!version) return undefined;
    const [project] = await this.database
      .update(projects)
      .set({ websiteId, versionId, status: 'ACTIVE', updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    return project;
  }

  async findProject(id: string) {
    const [project] = await this.database
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async createDeployment(
    projectId: string,
    websiteId: string,
    versionId: string,
    environment: DeploymentEnvironment,
    agentJobId: string,
  ) {
    const [existing] = await this.database
      .select()
      .from(deployments)
      .where(eq(deployments.agentJobId, agentJobId));
    if (existing) return existing;
    const [row] = await this.database
      .insert(deployments)
      .values({ projectId, websiteId, versionId, environment, agentJobId })
      .returning();
    return row;
  }

  async markDeploymentRunning(id: string) {
    await this.database
      .update(deployments)
      .set({ status: 'RUNNING', error: null })
      .where(eq(deployments.id, id));
  }

  completeDeployment(id: string, url: string) {
    return this.database.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(deployments)
        .where(eq(deployments.id, id));
      if (!target) return undefined;
      await tx
        .update(deployments)
        .set({ isActive: false })
        .where(
          and(
            eq(deployments.projectId, target.projectId),
            eq(deployments.environment, target.environment),
          ),
        );
      const [row] = await tx
        .update(deployments)
        .set({
          status: 'COMPLETED',
          url,
          isActive: true,
          completedAt: new Date(),
          error: null,
        })
        .where(eq(deployments.id, id))
        .returning();
      await tx
        .update(projects)
        .set({
          status: target.environment === 'PRODUCTION' ? 'DELIVERED' : 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(projects.id, target.projectId));
      return row;
    });
  }

  async failDeployment(id: string) {
    await this.database
      .update(deployments)
      .set({
        status: 'FAILED',
        error: 'Local deployment failed',
        completedAt: new Date(),
      })
      .where(eq(deployments.id, id));
  }

  listDeployments() {
    return this.database
      .select()
      .from(deployments)
      .orderBy(desc(deployments.createdAt));
  }

  rollback(projectId: string, targetId: string) {
    return this.database.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(deployments)
        .where(
          and(
            eq(deployments.id, targetId),
            eq(deployments.projectId, projectId),
            eq(deployments.status, 'COMPLETED'),
          ),
        );
      if (!target?.url) return undefined;
      const [current] = await tx
        .select()
        .from(deployments)
        .where(
          and(
            eq(deployments.projectId, projectId),
            eq(deployments.environment, target.environment),
            eq(deployments.isActive, true),
          ),
        );
      if (current && current.id !== target.id)
        await tx
          .update(deployments)
          .set({ status: 'ROLLED_BACK', isActive: false })
          .where(eq(deployments.id, current.id));
      await tx
        .update(deployments)
        .set({ isActive: false })
        .where(
          and(
            eq(deployments.projectId, projectId),
            eq(deployments.environment, target.environment),
          ),
        );
      const [rollback] = await tx
        .insert(deployments)
        .values({
          projectId,
          websiteId: target.websiteId,
          versionId: target.versionId,
          environment: target.environment,
          status: 'COMPLETED',
          url: target.url,
          isActive: true,
          replacesDeploymentId: current?.id,
          completedAt: new Date(),
        })
        .returning();
      return rollback;
    });
  }
}
