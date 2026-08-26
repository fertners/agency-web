import {
  restaurantBusinessDataSchema,
  type GenerationJobPayload,
  type GenerationJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { createGenerationProcessor } from '../../src/processor.js';

describe('generation processor', () => {
  it('persists a ready version and completes the durable job', async () => {
    const websiteId = '9b050e23-dda7-4aab-a98b-360aa6128ca7';
    const versionId = 'c7ab0567-5d8e-4a4e-8fbb-eb8e9a9d46f5';
    const businessData = restaurantBusinessDataSchema.parse({
      kind: 'RESTAURANT',
      name: 'Unit Restaurant',
      slug: 'unit-restaurant',
      description: 'A deterministic unit-test restaurant.',
      cuisines: ['French'],
      address: {
        street: '1 Unit Street',
        postalCode: '33000',
        city: 'Bordeaux',
        countryCode: 'FR',
      },
      contact: { email: 'unit@example.com' },
      openingHours: [],
      services: ['DINE_IN'],
      menuHighlights: [],
    });
    const markRunning = vi.fn().mockResolvedValue(undefined);
    const markCompleted = vi.fn().mockResolvedValue(undefined);
    const processor = createGenerationProcessor(
      {
        agentJobs: {
          markRunning,
          markCompleted,
          markPendingRetry: vi.fn().mockResolvedValue(undefined),
          markFailed: vi.fn().mockResolvedValue(undefined),
        },
        websites: {
          findBusinessForWebsite: vi.fn().mockResolvedValue({
            id: '66b9db78-9196-47fe-b80d-3908a928181c',
            kind: 'RESTAURANT',
            name: businessData.name,
            slug: businessData.slug,
            data: businessData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          createVersion: vi.fn().mockResolvedValue({
            id: versionId,
            websiteId,
            agentJobId: 'generation-job',
            version: 1,
            status: 'READY',
            config: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
      new AIClient(new LocalAIProvider()),
    );
    const job = {
      id: 'generation-job',
      data: { websiteId },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<GenerationJobPayload, GenerationJobResult>;

    const result = await processor(job);

    expect(markRunning).toHaveBeenCalledWith('generation-job', 1);
    expect(result).toMatchObject({ websiteId, versionId, version: 1 });
    expect(markCompleted).toHaveBeenCalledWith('generation-job', 1, result);
  });
});
import { AIClient, LocalAIProvider } from '@ai-web-agency/ai';
