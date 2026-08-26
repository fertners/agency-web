import { AIClient, LocalAIProvider } from '@ai-web-agency/ai';
import {
  AgentJobRepository,
  AICallRepository,
  createDatabaseClient,
  WebsiteRepository,
} from '@ai-web-agency/database';
import {
  createGenerationQueue,
  createRedisConnection,
  GENERATE_RESTAURANT_JOB_NAME,
} from '@ai-web-agency/queue';
import { restaurantBusinessDataSchema } from '@ai-web-agency/shared';
import { QueueEvents } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { createGenerationWorker } from '../../src/worker.js';

describe('restaurant generation workflow', () => {
  const database = createDatabaseClient({ maxConnections: 3 });
  const agentJobs = new AgentJobRepository(database.db);
  const websites = new WebsiteRepository(database.db);
  const aiCalls = new AICallRepository(database.db);
  const ai = new AIClient(new LocalAIProvider(), {
    record: (record) => aiCalls.record(record).then(() => undefined),
  });
  const createdBusinessIds: string[] = [];
  const createdJobIds: string[] = [];

  afterAll(async () => {
    for (const businessId of createdBusinessIds) {
      await database.pool.query('delete from businesses where id = $1', [
        businessId,
      ]);
    }
    for (const jobId of createdJobIds) {
      await database.pool.query('delete from ai_calls where job_id = $1', [
        jobId,
      ]);
      await database.pool.query('delete from agent_jobs where id = $1', [
        jobId,
      ]);
    }
    await database.close();
  });

  it('creates one ready, previewable version through BullMQ', async () => {
    const business = restaurantBusinessDataSchema.parse({
      kind: 'RESTAURANT',
      name: 'Pipeline Restaurant',
      slug: `pipeline-${randomUUID()}`,
      description:
        'Une cuisine locale construite par le workflow de génération.',
      cuisines: ['Française'],
      address: {
        street: '4 rue du Pipeline',
        postalCode: '33000',
        city: 'Bordeaux',
        countryCode: 'FR',
      },
      contact: { email: 'pipeline@example.com' },
      openingHours: [],
      services: ['DINE_IN', 'RESERVATIONS'],
      menuHighlights: [],
    });
    const created = await websites.createRestaurantWebsite(business);
    createdBusinessIds.push(created.business.id);
    const payload = { websiteId: created.website.id };
    const record = await agentJobs.createTyped(
      'website.generate.restaurant',
      payload,
    );
    createdJobIds.push(record.id);

    const queueName = `generation-test-${randomUUID()}`;
    const queue = createGenerationQueue({ queueName });
    const events = new QueueEvents(queueName, {
      connection: createRedisConnection(),
    });
    const worker = createGenerationWorker({ agentJobs, websites }, ai, {
      queueName,
    });

    try {
      await events.waitUntilReady();
      const job = await queue.add(GENERATE_RESTAURANT_JOB_NAME, payload, {
        jobId: record.id,
      });
      await agentJobs.markQueued(record.id, queueName, job.id ?? record.id);
      const result = await job.waitUntilFinished(events, 15_000);
      const persistedJob = await agentJobs.findById(record.id);
      const versions = await websites.listVersions(created.website.id);
      const calls = await aiCalls.listForJob(record.id);

      expect(result.previewPath).toBe(
        `/preview/${created.website.id}/${result.versionId}`,
      );
      expect(persistedJob).toMatchObject({ status: 'COMPLETED', attempt: 1 });
      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({ status: 'READY', version: 1 });
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({
        provider: 'local',
        model: 'restaurant-deterministic-v1',
        costMicros: 0,
        error: null,
      });
    } finally {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  });
});
