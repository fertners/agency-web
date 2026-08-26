import {
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
} from '@ai-web-agency/shared';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  businesses,
  createDatabaseClient,
  WebsiteRepository,
  type DatabaseClient,
} from '../../src/index.js';

describe('restaurant website persistence', () => {
  let client: DatabaseClient;
  let repository: WebsiteRepository;
  let businessId: string | undefined;

  const business = restaurantBusinessDataSchema.parse({
    kind: 'RESTAURANT',
    name: 'Restaurant Integration',
    slug: `restaurant-${randomUUID()}`,
    description: 'Restaurant used by the database integration suite.',
    cuisines: ['French'],
    address: {
      street: '1 Test Street',
      postalCode: '33000',
      city: 'Bordeaux',
      countryCode: 'FR',
    },
    contact: { email: 'integration@example.com' },
    openingHours: [],
    services: ['DINE_IN'],
    menuHighlights: [],
  });

  const config = restaurantWebsiteConfigSchema.parse({
    schemaVersion: 1,
    business,
    content: {
      headline: 'Seasonal cuisine',
      subheadline: 'A concise restaurant promise.',
      about: 'A structured description for the preview.',
      primaryCallToAction: 'Book a table',
      specialtiesHeading: 'Our specialties',
      seoTitle: 'Restaurant Integration in Bordeaux',
      seoDescription: 'A restaurant integration fixture located in Bordeaux.',
    },
    design: {
      tone: 'MODERN',
      primaryColor: '#112233',
      accentColor: '#CC8844',
      backgroundColor: '#FAFAFA',
      textColor: '#111111',
      styleKeywords: ['clean'],
    },
    sections: ['HERO', 'ABOUT', 'CONTACT'],
    generatedAt: '2026-08-25T20:00:00.000Z',
  });

  beforeAll(() => {
    client = createDatabaseClient({ maxConnections: 3 });
    repository = new WebsiteRepository(client.db);
  });

  afterAll(async () => {
    if (businessId !== undefined) {
      await client.db.delete(businesses).where(eq(businesses.id, businessId));
    }
    await client.close();
  });

  it('creates a restaurant and its website atomically', async () => {
    const created = await repository.createRestaurantWebsite(business);
    businessId = created.business.id;

    expect(created.business.data).toEqual(business);
    expect(created.website).toMatchObject({
      businessId,
      status: 'DRAFT',
      templateKey: 'restaurant-v1',
    });
  });

  it('allocates stable sequential version numbers', async () => {
    const created = await repository.createRestaurantWebsite({
      ...business,
      slug: `versioned-${randomUUID()}`,
      name: 'Versioned Restaurant',
    });

    const versions = await Promise.all([
      repository.createVersion(created.website.id, config),
      repository.createVersion(created.website.id, config),
    ]);
    const persisted = await repository.listVersions(created.website.id);

    expect(versions.map(({ version }) => version).sort()).toEqual([1, 2]);
    expect(persisted.map(({ version }) => version)).toEqual([1, 2]);
    expect(persisted[0]?.config).toEqual(config);

    await client.db
      .delete(businesses)
      .where(eq(businesses.id, created.business.id));
  });

  it('keeps version history while changing human review decisions', async () => {
    const created = await repository.createRestaurantWebsite({
      ...business,
      slug: `reviewed-${randomUUID()}`,
      name: 'Reviewed Restaurant',
    });
    const first = await repository.createVersion(created.website.id, config, {
      ready: true,
    });
    const second = await repository.createVersion(created.website.id, config, {
      ready: true,
    });

    await repository.setVersionReviewStatus(
      created.website.id,
      first.id,
      'APPROVED',
    );
    await repository.setVersionReviewStatus(
      created.website.id,
      second.id,
      'APPROVED',
    );
    await repository.setVersionReviewStatus(
      created.website.id,
      second.id,
      'REJECTED',
    );
    const versions = await repository.listVersions(created.website.id);

    expect(versions).toHaveLength(2);
    expect(versions.map(({ status }) => status)).toEqual(['READY', 'REJECTED']);

    await client.db
      .delete(businesses)
      .where(eq(businesses.id, created.business.id));
  });
});
