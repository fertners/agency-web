import {
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
  type RestaurantBusinessData,
  type RestaurantWebsiteConfig,
} from '@ai-web-agency/shared';
import { and, asc, desc, eq, max } from 'drizzle-orm';

import type { Database } from './client.js';
import {
  businesses,
  websites,
  websiteVersions,
  type Business,
  type Website,
  type WebsiteVersion,
} from './schema/index.js';

export type CreatedRestaurantWebsite = Readonly<{
  business: Business;
  website: Website;
}>;

export type WebsiteListItem = Readonly<{
  website: Website;
  business: Business;
  latestVersion: WebsiteVersion | undefined;
}>;

export class WebsiteRepository {
  constructor(private readonly database: Database) {}

  createRestaurantWebsite(
    input: RestaurantBusinessData,
  ): Promise<CreatedRestaurantWebsite> {
    const data = restaurantBusinessDataSchema.parse(input);

    return this.database.transaction(async (transaction) => {
      const [business] = await transaction
        .insert(businesses)
        .values({ kind: data.kind, name: data.name, slug: data.slug, data })
        .returning();
      if (business === undefined) {
        throw new Error('Failed to create restaurant business');
      }

      const [website] = await transaction
        .insert(websites)
        .values({ businessId: business.id })
        .returning();
      if (website === undefined) {
        throw new Error('Failed to create restaurant website');
      }

      return { business, website };
    });
  }

  createRestaurantWebsiteForCompany(
    companyId: string,
    input: RestaurantBusinessData,
  ): Promise<CreatedRestaurantWebsite> {
    const data = restaurantBusinessDataSchema.parse(input);
    return this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select({ website: websites, business: businesses })
        .from(websites)
        .innerJoin(businesses, eq(businesses.id, websites.businessId))
        .where(eq(websites.companyId, companyId))
        .orderBy(desc(websites.createdAt))
        .limit(1);
      if (existing !== undefined) {
        return {
          website: existing.website,
          business: {
            ...existing.business,
            data: restaurantBusinessDataSchema.parse(existing.business.data),
          },
        };
      }

      const [business] = await transaction
        .insert(businesses)
        .values({ kind: data.kind, name: data.name, slug: data.slug, data })
        .returning();
      if (business === undefined)
        throw new Error('Failed to create restaurant business');
      const [website] = await transaction
        .insert(websites)
        .values({ businessId: business.id, companyId })
        .returning();
      if (website === undefined)
        throw new Error('Failed to create company website');
      return { business, website };
    });
  }

  async findWebsiteById(id: string): Promise<Website | undefined> {
    const [website] = await this.database
      .select()
      .from(websites)
      .where(eq(websites.id, id));
    return website;
  }

  async listRecent(limit = 20): Promise<WebsiteListItem[]> {
    const rows = await this.database
      .select({ website: websites, business: businesses })
      .from(websites)
      .innerJoin(businesses, eq(businesses.id, websites.businessId))
      .orderBy(desc(websites.createdAt))
      .limit(limit);

    return Promise.all(
      rows.map(async ({ website, business }) => {
        const [latestVersion] = await this.database
          .select()
          .from(websiteVersions)
          .where(eq(websiteVersions.websiteId, website.id))
          .orderBy(desc(websiteVersions.version))
          .limit(1);
        return {
          website,
          business: {
            ...business,
            data: restaurantBusinessDataSchema.parse(business.data),
          },
          latestVersion:
            latestVersion === undefined
              ? undefined
              : {
                  ...latestVersion,
                  config: restaurantWebsiteConfigSchema.parse(
                    latestVersion.config,
                  ),
                },
        };
      }),
    );
  }

  async findBusinessForWebsite(
    websiteId: string,
  ): Promise<Business | undefined> {
    const [business] = await this.database
      .select({ business: businesses })
      .from(websites)
      .innerJoin(businesses, eq(businesses.id, websites.businessId))
      .where(eq(websites.id, websiteId));
    if (business === undefined) return undefined;

    return {
      ...business.business,
      data: restaurantBusinessDataSchema.parse(business.business.data),
    };
  }

  createVersion(
    websiteId: string,
    input: RestaurantWebsiteConfig,
    options: { agentJobId?: string; ready?: boolean } = {},
  ): Promise<WebsiteVersion> {
    const config = restaurantWebsiteConfigSchema.parse(input);

    return this.database.transaction(async (transaction) => {
      const [lockedWebsite] = await transaction
        .select({ id: websites.id })
        .from(websites)
        .where(eq(websites.id, websiteId))
        .for('update');
      if (lockedWebsite === undefined) {
        throw new Error('Website not found');
      }

      if (options.agentJobId !== undefined) {
        const [existing] = await transaction
          .select()
          .from(websiteVersions)
          .where(eq(websiteVersions.agentJobId, options.agentJobId));
        if (existing !== undefined) {
          return {
            ...existing,
            config: restaurantWebsiteConfigSchema.parse(existing.config),
          };
        }
      }

      const [latest] = await transaction
        .select({ value: max(websiteVersions.version) })
        .from(websiteVersions)
        .where(eq(websiteVersions.websiteId, websiteId));
      const version = (latest?.value ?? 0) + 1;

      const [created] = await transaction
        .insert(websiteVersions)
        .values({
          websiteId,
          version,
          config,
          ...(options.agentJobId === undefined
            ? {}
            : { agentJobId: options.agentJobId }),
          ...(options.ready === true ? { status: 'READY' as const } : {}),
        })
        .returning();
      if (created === undefined) {
        throw new Error('Failed to create website version');
      }

      await transaction
        .update(websites)
        .set({
          ...(config.generation === undefined
            ? {}
            : { templateKey: config.generation.theme.themeKey }),
          ...(options.ready === true ? { status: 'READY' as const } : {}),
          updatedAt: new Date(),
        })
        .where(eq(websites.id, websiteId));
      return created;
    });
  }

  async listVersions(websiteId: string): Promise<WebsiteVersion[]> {
    const versions = await this.database
      .select()
      .from(websiteVersions)
      .where(eq(websiteVersions.websiteId, websiteId))
      .orderBy(asc(websiteVersions.version));

    return versions.map((version) => ({
      ...version,
      config: restaurantWebsiteConfigSchema.parse(version.config),
    }));
  }

  async restoreVersion(
    websiteId: string,
    versionId: string,
  ): Promise<WebsiteVersion> {
    const source = await this.findVersion(websiteId, versionId);
    if (source === undefined) throw new Error('Website version not found');
    return this.createVersion(websiteId, source.config, { ready: true });
  }

  setVersionReviewStatus(
    websiteId: string,
    versionId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<WebsiteVersion> {
    return this.database.transaction(async (transaction) => {
      const [lockedWebsite] = await transaction
        .select({ id: websites.id })
        .from(websites)
        .where(eq(websites.id, websiteId))
        .for('update');
      if (lockedWebsite === undefined) throw new Error('Website not found');

      if (status === 'APPROVED') {
        await transaction
          .update(websiteVersions)
          .set({ status: 'READY', updatedAt: new Date() })
          .where(
            and(
              eq(websiteVersions.websiteId, websiteId),
              eq(websiteVersions.status, 'APPROVED'),
            ),
          );
      }

      const [updated] = await transaction
        .update(websiteVersions)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(websiteVersions.id, versionId),
            eq(websiteVersions.websiteId, websiteId),
          ),
        )
        .returning();
      if (updated === undefined) throw new Error('Website version not found');

      await transaction
        .update(websites)
        .set({
          status: status === 'APPROVED' ? 'APPROVED' : 'NEEDS_CHANGES',
          updatedAt: new Date(),
        })
        .where(eq(websites.id, websiteId));

      return {
        ...updated,
        config: restaurantWebsiteConfigSchema.parse(updated.config),
      };
    });
  }

  async findVersion(
    websiteId: string,
    versionId: string,
  ): Promise<WebsiteVersion | undefined> {
    const [version] = await this.database
      .select()
      .from(websiteVersions)
      .where(
        and(
          eq(websiteVersions.id, versionId),
          eq(websiteVersions.websiteId, websiteId),
        ),
      );
    if (version === undefined) return undefined;

    return {
      ...version,
      config: restaurantWebsiteConfigSchema.parse(version.config),
    };
  }
}
