import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  agentJobs,
  createDatabaseClient,
  type DatabaseClient,
} from '../../src/index.js';

describe('agentJobs persistence', () => {
  let client: DatabaseClient;
  const jobId = randomUUID();

  beforeAll(() => {
    client = createDatabaseClient({ maxConnections: 1 });
  });

  afterAll(async () => {
    await client.db.delete(agentJobs).where(eq(agentJobs.id, jobId));
    await client.close();
  });

  it('persists and reads a pending diagnostic job', async () => {
    await client.db.insert(agentJobs).values({
      id: jobId,
      type: 'foundation.diagnostic',
      status: 'PENDING',
      input: { requestedAt: '2026-08-25T12:00:00.000Z' },
    });

    const persistedJobs = await client.db
      .select()
      .from(agentJobs)
      .where(eq(agentJobs.id, jobId));

    expect(persistedJobs).toHaveLength(1);
    expect(persistedJobs[0]).toMatchObject({
      id: jobId,
      type: 'foundation.diagnostic',
      status: 'PENDING',
      attempt: 0,
    });
  });
});
