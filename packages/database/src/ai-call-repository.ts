import { eq } from 'drizzle-orm';

import type { Database } from './client.js';
import { aiCalls, type AICall, type NewAICall } from './schema/index.js';

export type AICallInput = Omit<NewAICall, 'id' | 'createdAt'>;

export class AICallRepository {
  constructor(private readonly database: Database) {}

  async record(input: AICallInput): Promise<AICall> {
    const [call] = await this.database
      .insert(aiCalls)
      .values(input)
      .returning();
    if (call === undefined) throw new Error('Failed to record AI call');
    return call;
  }

  listForJob(jobId: string): Promise<AICall[]> {
    return this.database.select().from(aiCalls).where(eq(aiCalls.jobId, jobId));
  }
}
