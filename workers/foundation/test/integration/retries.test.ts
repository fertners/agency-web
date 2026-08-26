import {
  AgentJobRepository,
  createDatabaseClient,
} from '@ai-web-agency/database';
import {
  createFoundationQueue,
  createRedisConnection,
  DIAGNOSTIC_JOB_NAME,
} from '@ai-web-agency/queue';
import { QueueEvents } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createFoundationWorker } from '../../src/worker.js';
import type { DiagnosticHandler } from '../../src/processor.js';

describe('foundation worker retries', () => {
  const database = createDatabaseClient({ maxConnections: 2 });
  const repository = new AgentJobRepository(database.db);
  const createdJobIds: string[] = [];

  beforeAll(async () => {
    await database.pool.query('select 1');
  });

  afterAll(async () => {
    for (const id of createdJobIds) {
      await database.pool.query('delete from agent_jobs where id = $1', [id]);
    }
    await database.close();
  });

  it('completes after one controlled retry', async () => {
    let calls = 0;
    const result = await runScenario(() => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new Error('controlled first failure'));
      }
      return Promise.resolve({
        processedAt: new Date().toISOString(),
        worker: 'foundation',
      });
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.attempt).toBe(2);
  });

  it('becomes failed after the bounded attempts', async () => {
    const result = await runScenario(() =>
      Promise.reject(new Error('sensitive upstream failure')),
    );

    expect(result.status).toBe('FAILED');
    expect(result.attempt).toBe(3);
    expect(result.error).toBe('Diagnostic job failed');
  });

  async function runScenario(handler: DiagnosticHandler) {
    const queueName = `foundation-test-${randomUUID()}`;
    const payload = { requestedAt: new Date().toISOString() };
    const record = await repository.create(payload);
    createdJobIds.push(record.id);
    const queue = createFoundationQueue({ queueName });
    const events = new QueueEvents(queueName, {
      connection: createRedisConnection(),
    });
    const worker = createFoundationWorker(repository, { queueName, handler });

    try {
      await events.waitUntilReady();
      const job = await queue.add(DIAGNOSTIC_JOB_NAME, payload, {
        jobId: record.id,
      });
      await repository.markQueued(record.id, queueName, job.id ?? record.id);
      await job.waitUntilFinished(events, 15_000).catch(() => undefined);
      const persisted = await repository.findById(record.id);
      if (persisted === undefined) throw new Error('Persisted job not found');
      return persisted;
    } finally {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  }
});
