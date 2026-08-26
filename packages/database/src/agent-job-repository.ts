import { desc, eq } from 'drizzle-orm';

import type { Database } from './client.js';
import { agentJobs, type AgentJob } from './schema/index.js';

export class AgentJobRepository {
  constructor(private readonly database: Database) {}

  async create(input: Record<string, unknown>): Promise<AgentJob> {
    return this.createTyped('foundation.diagnostic', input);
  }

  async createTyped(
    type: string,
    input: Record<string, unknown>,
  ): Promise<AgentJob> {
    const [job] = await this.database
      .insert(agentJobs)
      .values({ type, input })
      .returning();

    if (job === undefined) {
      throw new Error('Failed to create agent job');
    }
    return job;
  }

  async findById(id: string): Promise<AgentJob | undefined> {
    const [job] = await this.database
      .select()
      .from(agentJobs)
      .where(eq(agentJobs.id, id));
    return job;
  }

  async listRecent(limit = 20): Promise<AgentJob[]> {
    return this.database
      .select()
      .from(agentJobs)
      .orderBy(desc(agentJobs.createdAt))
      .limit(limit);
  }

  async markQueued(
    id: string,
    queueName: string,
    queueJobId: string,
  ): Promise<void> {
    await this.database
      .update(agentJobs)
      .set({ queueName, queueJobId, updatedAt: new Date() })
      .where(eq(agentJobs.id, id));
  }

  async markRunning(id: string, attempt: number): Promise<void> {
    await this.database
      .update(agentJobs)
      .set({
        status: 'RUNNING',
        attempt,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentJobs.id, id));
  }

  async markPendingRetry(id: string, attempt: number): Promise<void> {
    await this.database
      .update(agentJobs)
      .set({ status: 'PENDING', attempt, error: null, updatedAt: new Date() })
      .where(eq(agentJobs.id, id));
  }

  async markCompleted(
    id: string,
    attempt: number,
    output: Record<string, unknown>,
  ): Promise<void> {
    await this.database
      .update(agentJobs)
      .set({
        status: 'COMPLETED',
        attempt,
        output,
        error: null,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentJobs.id, id));
  }

  async markFailed(
    id: string,
    attempt: number,
    message = 'Job failed',
  ): Promise<void> {
    await this.database
      .update(agentJobs)
      .set({
        status: 'FAILED',
        attempt,
        error: message,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentJobs.id, id));
  }
}
