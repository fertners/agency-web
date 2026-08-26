import { restaurantBusinessDataSchema } from '@ai-web-agency/shared';
import { describe, expect, it, vi } from 'vitest';

import { AIClient, LocalAIProvider, type AIProvider } from '../src/index.js';

const business = restaurantBusinessDataSchema.parse({
  kind: 'RESTAURANT',
  name: 'AI Test',
  slug: 'ai-test',
  description: 'A structured restaurant description.',
  cuisines: ['French'],
  address: {
    street: '1 AI Street',
    postalCode: '33000',
    city: 'Bordeaux',
    countryCode: 'FR',
  },
  contact: { email: 'ai@example.com' },
  openingHours: [],
  services: ['RESERVATIONS'],
  menuHighlights: [],
});

describe('AIClient', () => {
  it('validates output and records provider metadata', async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const client = new AIClient(new LocalAIProvider(), { record });

    const result = await client.generateRestaurantBrief({
      business,
      jobId: '9b050e23-dda7-4aab-a98b-360aa6128ca7',
    });

    expect(result.content.primaryCallToAction).toBe('Réserver une table');
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'local',
        model: 'restaurant-deterministic-v1',
        context: 'restaurant.website.brief',
        error: null,
        costMicros: 0,
      }),
    );
  });

  it('rejects an invalid provider output and records the failure', async () => {
    const provider: AIProvider = {
      name: 'invalid',
      model: 'invalid-v1',
      generateRestaurantBrief: () =>
        Promise.resolve({ output: { content: {}, design: {} } as never }),
      reviewWebsiteDesign: () => Promise.reject(new Error('not used')),
      proposeWebsiteCorrection: () => Promise.reject(new Error('not used')),
    };
    const record = vi.fn().mockResolvedValue(undefined);
    const client = new AIClient(provider, { record });

    await expect(
      client.generateRestaurantBrief({ business, jobId: crypto.randomUUID() }),
    ).rejects.toBeDefined();
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'invalid', output: null }),
    );
  });
});
