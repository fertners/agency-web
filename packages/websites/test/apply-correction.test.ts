import { restaurantWebsiteConfigSchema } from '@ai-web-agency/shared';
import { describe, expect, it } from 'vitest';
import { applyWebsiteCorrection } from '../src/index.js';

describe('applyWebsiteCorrection', () => {
  it('creates a validated copy without mutating the source config', () => {
    const config = restaurantWebsiteConfigSchema.parse({
      schemaVersion: 1,
      business: {
        kind: 'RESTAURANT',
        name: 'Test',
        slug: 'test',
        description: 'Description',
        cuisines: ['French'],
        address: {
          street: '1 rue Test',
          postalCode: '33000',
          city: 'Bordeaux',
          countryCode: 'FR',
        },
        contact: { email: 'test@example.com' },
        openingHours: [],
        services: [],
        menuHighlights: [],
      },
      content: {
        headline: 'Original headline',
        subheadline: 'Original subheadline',
        about: 'About',
        primaryCallToAction: 'Contact',
        specialtiesHeading: 'Menu',
        seoTitle: 'Test restaurant',
        seoDescription: 'Test restaurant description',
      },
      design: {
        tone: 'ELEGANT',
        primaryColor: '#111111',
        accentColor: '#222222',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        styleKeywords: ['clean'],
      },
      sections: ['HERO', 'CONTACT'],
      generatedAt: new Date(0).toISOString(),
    });
    const corrected = applyWebsiteCorrection(config, {
      content: { headline: 'Corrected headline' },
    });
    expect(corrected.content.headline).toBe('Corrected headline');
    expect(config.content.headline).toBe('Original headline');
    expect(corrected.generatedAt).not.toBe(config.generatedAt);
  });
});
