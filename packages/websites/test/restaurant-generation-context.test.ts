import {
  restaurantBusinessDataSchema,
  type RestaurantBusinessData,
} from '@ai-web-agency/shared';
import { describe, expect, it } from 'vitest';

import {
  generateRestaurantConfig,
  prepareRestaurantGeneration,
  selectRestaurantTheme,
} from '../src/index.js';

function restaurant(
  overrides: Partial<RestaurantBusinessData> = {},
): RestaurantBusinessData {
  return restaurantBusinessDataSchema.parse({
    kind: 'RESTAURANT',
    name: 'Maison Test',
    slug: 'maison-test',
    description: 'Une table locale.',
    cuisines: ['Française'],
    address: {
      street: '1 rue Test',
      postalCode: '33000',
      city: 'Bordeaux',
      countryCode: 'FR',
    },
    contact: { email: 'contact@example.com' },
    openingHours: [],
    services: ['DINE_IN'],
    menuHighlights: [],
    ...overrides,
  });
}

describe('restaurant brand, content and theme preparation', () => {
  it('uses the dark saffron restaurant standard when no brand signal is available', () => {
    const selection = selectRestaurantTheme(restaurant());

    expect(selection).toMatchObject({
      themeKey: 'restaurant-mediterranean-v1',
      usedCategoryFallback: true,
      matchedSignals: [],
    });
  });

  it('keeps the restaurant standard for warm business wording', () => {
    const selection = selectRestaurantTheme(
      restaurant({ description: 'Un bistrot familial et authentique.' }),
    );

    expect(selection.themeKey).toBe('restaurant-mediterranean-v1');
    expect(selection.usedCategoryFallback).toBe(true);
  });

  it('keeps the restaurant standard for pizza businesses', () => {
    const selection = selectRestaurantTheme(
      restaurant({ cuisines: ['pizza', 'italian'] }),
    );

    expect(selection).toMatchObject({
      themeKey: 'restaurant-mediterranean-v1',
      usedCategoryFallback: true,
      matchedSignals: [],
    });
  });

  it('selects the dark saffron theme for Greek restaurants', () => {
    const selection = selectRestaurantTheme(
      restaurant({ cuisines: ['Grecque', 'Méditerranéenne'] }),
    );

    expect(selection).toMatchObject({
      themeKey: 'restaurant-mediterranean-v1',
      usedCategoryFallback: false,
    });
    expect(selection.matchedSignals).toContain('grecque');
  });

  it('omits unsupported sections instead of inventing their content', () => {
    const input = restaurant();
    const generation = prepareRestaurantGeneration(input);
    const config = generateRestaurantConfig(
      input,
      new Date('2026-08-26T10:00:00.000Z'),
      undefined,
      generation,
    );

    expect(config.sections).not.toContain('SPECIALTIES');
    expect(config.sections).not.toContain('REVIEWS');
    expect(config.sections).not.toContain('OPENING_HOURS');
    expect(config.generation?.content.omittedSections).toEqual(
      expect.arrayContaining(['SPECIALTIES', 'REVIEWS', 'OPENING_HOURS']),
    );
  });

  it('applies sourced brand tokens on top of the selected theme', () => {
    const input = restaurant({
      brandProfile: {
        businessName: 'Maison Test',
        category: 'RESTAURANT',
        colors: ['#102030', '#D0A020'],
        headingFont: 'Arial, sans-serif',
        styleKeywords: ['contemporain'],
        assets: [],
        confidence: 0.9,
        sources: [
          {
            id: 'official-site',
            type: 'OFFICIAL_WEBSITE',
            url: 'https://example.com',
            capturedAt: '2026-08-26T09:00:00.000Z',
            claims: ['brand-colors', 'typography'],
          },
        ],
      },
    });
    const generation = prepareRestaurantGeneration(input);
    const config = generateRestaurantConfig(
      input,
      new Date('2026-08-26T10:00:00.000Z'),
      undefined,
      generation,
    );

    expect(generation.theme.themeKey).toBe('restaurant-mediterranean-v1');
    expect(config.design).toMatchObject({
      primaryColor: '#102030',
      accentColor: '#D0A020',
      headingFont: 'Arial, sans-serif',
    });
    expect(config.generation?.brand.sources[0]?.id).toBe('official-site');
  });
});
