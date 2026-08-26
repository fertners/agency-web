import { describe, expect, it } from 'vitest';
import {
  buildCommercialProposalContent,
  PROPOSAL_PRICE_CENTS,
} from '../../src/modules/commercial/proposal-content.js';

describe('commercial proposal content', () => {
  it('uses persisted analysis evidence, preview and quote without invention', () => {
    const result = buildCommercialProposalContent({
      companyName: 'Le Test',
      assessment: {
        score: 86,
        components: {
          websiteQuality: 35,
          mobile: 42,
          seo: 48,
          businessQuality: 80,
          missingFeatures: 30,
          contactability: 90,
        },
        summary: 'Analyse réelle',
        evidence: [
          'Le site ne contient pas de balise H1.',
          'Contact direct disponible',
        ],
        weights: {
          websiteQuality: 25,
          mobile: 20,
          seo: 20,
          businessQuality: 15,
          missingFeatures: 10,
          contactability: 10,
        },
      },
      priceCents: 250000,
      currency: 'EUR',
      timelineDays: 21,
      scope: ['Site responsive', 'SEO local'],
    });
    expect(result.issues).toContain('Le site ne contient pas de balise H1.');
    expect(result.issues).not.toContain('Contact direct disponible');
    expect(result.message).toContain('86/100');
    expect(result.message).toContain('2 500,00 €');
    expect(result.message).toContain('Répondre à cette proposition');
    expect(result.message).not.toContain('http://127.0.0.1:3002/preview');
  });

  it('applies the two fixed commercial prices', () => {
    expect(PROPOSAL_PRICE_CENTS.SHOWCASE).toBe(25_000);
    expect(PROPOSAL_PRICE_CENTS.DYNAMIC).toBe(100_000);
  });
});
