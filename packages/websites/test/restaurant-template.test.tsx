import { restaurantWebsiteConfigSchema } from '@ai-web-agency/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RestaurantTemplate } from '../src/index.js';

const config = restaurantWebsiteConfigSchema.parse({
  schemaVersion: 1,
  business: {
    kind: 'RESTAURANT',
    name: 'Maison Galatée',
    slug: 'maison-galatee',
    tagline: 'Cuisine vivante',
    description: 'Une table de saison.',
    cuisines: ['Française', 'Locale'],
    address: {
      street: '12 rue des Étoiles',
      postalCode: '33000',
      city: 'Bordeaux',
      countryCode: 'FR',
    },
    contact: { phone: '+33500000000', email: 'table@example.com' },
    openingHours: [
      { day: 'MONDAY', closed: true },
      { day: 'TUESDAY', closed: false, opensAt: '12:00', closesAt: '22:30' },
    ],
    services: ['DINE_IN', 'RESERVATIONS'],
    menuHighlights: [
      {
        name: 'Menu du marché',
        description: 'Trois temps selon les arrivages.',
        price: 39,
        currency: 'EUR',
      },
    ],
    reviews: [{ author: 'Camille', quote: 'Une très belle table.', rating: 5 }],
  },
  content: {
    headline: 'La saison dans votre assiette',
    subheadline: 'Des produits locaux cuisinés avec précision.',
    about:
      'Maison Galatée célèbre la région et celles et ceux qui la cultivent.',
    primaryCallToAction: 'Réserver une table',
    specialtiesHeading: 'Les assiettes du moment',
    seoTitle: 'Maison Galatée — Restaurant à Bordeaux',
    seoDescription: 'Cuisine française de saison à Bordeaux.',
  },
  design: {
    tone: 'ELEGANT',
    primaryColor: '#17231B',
    accentColor: '#C89348',
    backgroundColor: '#FAF7F0',
    textColor: '#18201A',
    styleKeywords: ['éditorial', 'naturel'],
  },
  sections: [
    'NAVBAR',
    'HERO',
    'ABOUT',
    'SPECIALTIES',
    'SERVICES',
    'REVIEWS',
    'OPENING_HOURS',
    'LOCATION',
    'CONTACT',
    'CTA',
    'FOOTER',
  ],
  generatedAt: '2026-08-25T20:00:00.000Z',
});

describe('RestaurantTemplate', () => {
  it('renders structured restaurant content without scripts', () => {
    const markup = renderToStaticMarkup(<RestaurantTemplate config={config} />);

    expect(markup).toContain('<h1>La saison dans votre assiette</h1>');
    expect(markup).toContain('Menu du marché');
    expect(markup).toContain('Réserver une table');
    expect(markup).toContain('aria-label="Navigation principale"');
    expect(markup).not.toContain('<script');
  });

  it('uses deterministic theme variables from the validated design brief', () => {
    const markup = renderToStaticMarkup(<RestaurantTemplate config={config} />);

    expect(markup).toContain('--awa-primary:#17231B');
    expect(markup).toContain('--awa-accent:#C89348');
  });
});
