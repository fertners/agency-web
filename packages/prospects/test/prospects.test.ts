import { describe, expect, it } from 'vitest';
import {
  assessOpportunity,
  companyFingerprint,
  LocalBusinessSearchProvider,
  OverpassBusinessSearchProvider,
} from '../src/index.js';
describe('prospect research', () => {
  it('deduplicates accents and punctuation', () =>
    expect(
      companyFingerprint({
        name: 'L’Atelier',
        city: 'Nîmes',
        countryCode: 'fr',
      }),
    ).toBe('l atelier|nimes|FR'));
  it('scores a business without a website as an opportunity', async () => {
    const [candidate] = await new LocalBusinessSearchProvider().search({
      city: 'Lyon',
      countryCode: 'FR',
      category: 'RESTAURANT',
      limit: 1,
    });
    expect(candidate).toBeDefined();
    expect(assessOpportunity(candidate!).score).toBeGreaterThanOrEqual(70);
  });
  it('maps and validates real Overpass records', async () => {
    const fetcher = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            elements: [
              {
                type: 'node',
                id: 42,
                tags: {
                  name: 'Le Vrai Restaurant',
                  website: 'restaurant.example',
                  'contact:phone': '+33400000000',
                  'addr:postcode': '69001',
                  cuisine: 'pizza;italian',
                  opening_hours: 'Mo-Sa 12:00-22:00',
                  image: 'https://images.example/restaurant.jpg',
                  'contact:instagram': 'https://instagram.com/restaurant',
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    const provider = new OverpassBusinessSearchProvider({
      fetcher,
      endpoint: 'https://overpass.test/interpreter',
    });
    const candidates = await provider.search({
      city: 'Lyon',
      countryCode: 'FR',
      category: 'RESTAURANT',
      limit: 5,
    });
    expect(candidates).toHaveLength(1);
    const candidate = candidates[0];
    expect(candidate).toMatchObject({
      source: 'openstreetmap-overpass',
      externalId: 'node/42',
      name: 'Le Vrai Restaurant',
      websiteUrl: 'https://restaurant.example/',
      cuisines: ['pizza', 'italian'],
      openingHoursRaw: 'Mo-Sa 12:00-22:00',
      socialLinks: { instagram: 'https://instagram.com/restaurant' },
      imageUrls: ['https://images.example/restaurant.jpg'],
    });
    expect(candidate?.brandProfile?.confidence).toBe(0.55);
    expect(candidate?.brandProfile?.assets[0]).toMatchObject({
      type: 'GALLERY',
      usageStatus: 'PENDING_REVIEW',
    });
    expect(candidate?.brandProfile?.sources[0]).toMatchObject({
      type: 'OPENSTREETMAP',
      url: 'https://www.openstreetmap.org/node/42',
    });
  });
});
