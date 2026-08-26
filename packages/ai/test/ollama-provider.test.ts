import { restaurantBusinessDataSchema } from '@ai-web-agency/shared';
import { describe, expect, it, vi } from 'vitest';

import { OllamaAIProvider } from '../src/index.js';

describe('OllamaAIProvider', () => {
  it('validates structured output and records local inference at zero cost', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              content: {
                headline: 'Chez Test',
                subheadline: 'Une table locale.',
                about: 'Restaurant à Paris.',
                primaryCallToAction: 'Nous contacter',
                specialtiesHeading: 'Nos spécialités',
                seoTitle: 'Chez Test — Restaurant à Paris',
                seoDescription: 'Restaurant à Paris.',
              },
              design: {
                tone: 'ELEGANT',
                primaryColor: '#17231B',
                accentColor: '#C89348',
                backgroundColor: '#FAF7F0',
                textColor: '#18201A',
                styleKeywords: ['local', 'sobre'],
              },
            }),
          },
          prompt_eval_count: 12,
          eval_count: 24,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const provider = new OllamaAIProvider({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'gemma3:4b',
      fetchImplementation,
    });
    const business = restaurantBusinessDataSchema.parse({
      kind: 'RESTAURANT',
      name: 'Chez Test',
      slug: 'chez-test',
      description: 'Restaurant à Paris.',
      cuisines: [],
      address: { city: 'Paris', countryCode: 'FR' },
      contact: {},
      openingHours: [],
      services: [],
      menuHighlights: [],
    });

    const result = await provider.generateRestaurantBrief({
      jobId: 'job-id',
      business,
    });

    expect(result.output.content.headline).toBe('Chez Test');
    expect(result.usage).toEqual({
      inputTokens: 12,
      outputTokens: 24,
      costMicros: 0,
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });
});
