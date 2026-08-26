import { createDatabaseClient } from '@ai-web-agency/database';
import {
  createFoundationQueue,
  createGenerationQueue,
} from '@ai-web-agency/queue';
import type {
  AgentJobListResponse,
  AgentJobResponse,
  CreateDiagnosticJobResponse,
  CreateRestaurantWebsiteResponse,
  HealthResponse,
  WebsiteListResponse,
} from '@ai-web-agency/shared';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApplication } from '../../src/bootstrap.js';

describe('GET /health', () => {
  let application: INestApplication;
  const database = createDatabaseClient({ maxConnections: 1 });
  const queue = createFoundationQueue();
  const generationQueue = createGenerationQueue();
  const createdJobIds: string[] = [];
  const createdWebsiteIds: string[] = [];

  beforeAll(async () => {
    application = await createApplication();
    await application.init();
  });

  afterAll(async () => {
    await application.close();
    for (const id of createdJobIds) {
      await (await queue.getJob(id))?.remove();
      await (await generationQueue.getJob(id))?.remove();
      await database.pool.query('delete from agent_jobs where id = $1', [id]);
    }
    for (const id of createdWebsiteIds) {
      await database.pool.query(
        'delete from businesses where id = (select business_id from websites where id = $1)',
        [id],
      );
    }
    await queue.close();
    await generationQueue.close();
    await database.close();
  });

  it('reports the real PostgreSQL and Redis dependencies', async () => {
    const server = application.getHttpServer() as Server;
    const response = await request(server).get('/health').expect(200);
    const body = response.body as HealthResponse;

    expect(body.status).toBe('UP');
    expect(body.services).toMatchObject({
      api: { status: 'UP' },
      postgres: { status: 'UP' },
      redis: { status: 'UP' },
    });
  });

  it('creates and exposes a durable pending diagnostic job', async () => {
    const creation = await request(application.getHttpServer() as Server)
      .post('/jobs/diagnostic')
      .send({})
      .expect(201);
    const created = creation.body as CreateDiagnosticJobResponse;
    createdJobIds.push(created.jobId);

    expect(created.status).toBe('PENDING');

    const lookup = await request(application.getHttpServer() as Server)
      .get(`/jobs/${created.jobId}`)
      .expect(200);
    const persisted = lookup.body as AgentJobResponse;

    expect(persisted).toMatchObject({
      jobId: created.jobId,
      type: 'foundation.diagnostic',
      status: 'PENDING',
      attempt: 0,
    });

    const list = await request(application.getHttpServer() as Server)
      .get('/jobs')
      .expect(200);
    const recentJobs = list.body as AgentJobListResponse;

    expect(recentJobs.jobs).toContainEqual(
      expect.objectContaining({ jobId: created.jobId }),
    );
  });

  it('returns 404 for a missing website version', async () => {
    const websiteId = randomUUID();
    const versionId = randomUUID();
    const server = application.getHttpServer() as Server;
    await request(server)
      .get(`/websites/${websiteId}/versions/${versionId}`)
      .expect(404);
    await request(server).get(`/websites/${websiteId}/versions`).expect(404);
    await request(server)
      .post(`/websites/${websiteId}/versions/${versionId}/approve`)
      .expect(404);
    await request(server)
      .post(`/websites/${websiteId}/versions/${versionId}/reject`)
      .expect(404);
  });

  it('creates a durable restaurant generation job', async () => {
    const response = await request(application.getHttpServer() as Server)
      .post('/websites/generate')
      .send({
        kind: 'RESTAURANT',
        name: 'API Restaurant',
        slug: `api-${randomUUID()}`,
        description: 'A restaurant created through the public API.',
        cuisines: ['French'],
        address: {
          street: '2 API Street',
          postalCode: '33000',
          city: 'Bordeaux',
          countryCode: 'FR',
        },
        contact: { email: 'api@example.com' },
        openingHours: [],
        services: ['DINE_IN'],
        menuHighlights: [],
      })
      .expect(201);
    const created = response.body as CreateRestaurantWebsiteResponse;
    createdJobIds.push(created.jobId);
    createdWebsiteIds.push(created.websiteId);

    expect(created.status).toBe('PENDING');
    const persisted = await request(application.getHttpServer() as Server)
      .get(`/jobs/${created.jobId}`)
      .expect(200);
    expect(persisted.body).toMatchObject({
      jobId: created.jobId,
      type: 'website.generate.restaurant',
      status: 'PENDING',
    });

    const websites = await request(application.getHttpServer() as Server)
      .get('/websites')
      .expect(200);
    const websiteList = websites.body as WebsiteListResponse;
    expect(websiteList.websites).toContainEqual(
      expect.objectContaining({
        websiteId: created.websiteId,
        name: 'API Restaurant',
        status: 'DRAFT',
      }),
    );
  });
});
