import { restaurantWebsiteConfigSchema } from '@ai-web-agency/shared';
import { describe, expect, it } from 'vitest';
import { auditRestaurantSeo, createRestaurantJsonLd } from '../src/index.js';

const config = restaurantWebsiteConfigSchema.parse({
  schemaVersion: 1,
  business: {
    kind: 'RESTAURANT',
    name: 'La Table',
    slug: 'la-table',
    description: 'Restaurant local',
    cuisines: ['Française'],
    address: {
      street: '1 rue Test',
      postalCode: '33000',
      city: 'Bordeaux',
      countryCode: 'FR',
    },
    contact: { phone: '0102030405' },
    openingHours: [],
    services: [],
    menuHighlights: [],
  },
  content: {
    headline: 'La Table Bordeaux',
    subheadline: 'Cuisine locale',
    about: 'Une table locale.',
    primaryCallToAction: 'Réserver',
    specialtiesHeading: 'La carte',
    seoTitle: 'La Table — Restaurant à Bordeaux',
    seoDescription:
      'Découvrez La Table, restaurant à Bordeaux proposant une cuisine française locale, généreuse et préparée avec des produits de saison.',
  },
  design: {
    tone: 'ELEGANT',
    primaryColor: '#111111',
    accentColor: '#222222',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    styleKeywords: ['local'],
  },
  sections: ['HERO', 'CONTACT'],
  generatedAt: new Date().toISOString(),
});
describe('restaurant SEO', () => {
  it('builds valid local SEO output', () => {
    expect(auditRestaurantSeo(config, 'https://example.com').passed).toBe(true);
    expect(createRestaurantJsonLd(config, 'https://example.com')['@type']).toBe(
      'Restaurant',
    );
  });
});
