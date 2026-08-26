import {
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
} from '../src/index.js';
import { describe, expect, it } from 'vitest';

const restaurant = {
  kind: 'RESTAURANT',
  name: 'Maison Galatée',
  slug: 'maison-galatee',
  description: 'Une table de saison au cœur de Bordeaux.',
  cuisines: ['Française'],
  address: {
    street: '12 rue des Étoiles',
    postalCode: '33000',
    city: 'Bordeaux',
    countryCode: 'fr',
  },
  contact: { phone: '+33 5 00 00 00 00' },
  openingHours: [
    { day: 'MONDAY', closed: true },
    { day: 'TUESDAY', closed: false, opensAt: '12:00', closesAt: '22:30' },
  ],
  services: ['DINE_IN', 'RESERVATIONS'],
  menuHighlights: [
    {
      name: 'Menu du marché',
      description: 'Entrée, plat et dessert selon les arrivages.',
      price: 39,
      currency: 'eur',
    },
  ],
} as const;

describe('restaurant website contracts', () => {
  it('normalizes validated restaurant business data', () => {
    const parsed = restaurantBusinessDataSchema.parse(restaurant);
    expect(parsed.address.countryCode).toBe('FR');
    expect(parsed.menuHighlights[0]?.currency).toBe('EUR');
  });

  it('rejects duplicate opening days', () => {
    const result = restaurantBusinessDataSchema.safeParse({
      ...restaurant,
      openingHours: [
        { day: 'MONDAY', closed: true },
        { day: 'MONDAY', closed: false, opensAt: '12:00', closesAt: '14:00' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a complete, structured website configuration', () => {
    const result = restaurantWebsiteConfigSchema.safeParse({
      schemaVersion: 1,
      business: restaurant,
      content: {
        headline: 'La saison dans votre assiette',
        subheadline: 'Une cuisine locale, vivante et généreuse.',
        about: 'Maison Galatée célèbre les produits régionaux.',
        primaryCallToAction: 'Réserver une table',
        specialtiesHeading: 'Les assiettes du moment',
        seoTitle: 'Maison Galatée — Restaurant à Bordeaux',
        seoDescription:
          'Découvrez une cuisine française de saison au centre de Bordeaux.',
      },
      design: {
        tone: 'ELEGANT',
        primaryColor: '#17231B',
        accentColor: '#C89348',
        backgroundColor: '#FAF7F0',
        textColor: '#18201A',
        styleKeywords: ['éditorial', 'naturel'],
      },
      sections: ['NAVBAR', 'HERO', 'ABOUT', 'SPECIALTIES', 'CONTACT', 'FOOTER'],
      generatedAt: '2026-08-25T19:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects duplicate sections and unrecognized fields', () => {
    const result = restaurantWebsiteConfigSchema.safeParse({
      schemaVersion: 1,
      business: { ...restaurant, unsafeHtml: '<script />' },
      content: {},
      design: {},
      sections: ['HERO', 'HERO'],
      generatedAt: '2026-08-25T19:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});
