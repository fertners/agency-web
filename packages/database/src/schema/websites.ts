import type {
  RestaurantBusinessData,
  RestaurantWebsiteConfig,
  WebsiteStatus,
  WebsiteVersionStatus,
} from '@ai-web-agency/shared';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { agentJobs } from './agent-jobs.js';

export const DATABASE_WEBSITE_STATUSES = [
  'DRAFT',
  'GENERATING',
  'READY',
  'ARCHIVED',
] as const satisfies readonly WebsiteStatus[];
export const DATABASE_WEBSITE_VERSION_STATUSES = [
  'DRAFT',
  'GENERATING',
  'READY',
  'APPROVED',
  'REJECTED',
] as const satisfies readonly WebsiteVersionStatus[];

export const websiteStatusEnum = pgEnum(
  'website_status',
  DATABASE_WEBSITE_STATUSES,
);
export const websiteVersionStatusEnum = pgEnum(
  'website_version_status',
  DATABASE_WEBSITE_VERSION_STATUSES,
);

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: varchar('kind', { length: 50 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    data: jsonb('data').$type<RestaurantBusinessData>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('businesses_kind_supported', sql`${table.kind} = 'RESTAURANT'`),
    uniqueIndex('businesses_slug_unique').on(table.slug),
  ],
);

export const websites = pgTable(
  'websites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    templateKey: varchar('template_key', { length: 100 })
      .notNull()
      .default('restaurant-v1'),
    status: websiteStatusEnum('status').notNull().default('DRAFT'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('websites_business_id_unique').on(table.businessId),
    index('websites_status_created_at_idx').on(table.status, table.createdAt),
  ],
);

export const websiteVersions = pgTable(
  'website_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteId: uuid('website_id')
      .notNull()
      .references(() => websites.id, { onDelete: 'cascade' }),
    agentJobId: uuid('agent_job_id').references(() => agentJobs.id, {
      onDelete: 'set null',
    }),
    version: integer('version').notNull(),
    status: websiteVersionStatusEnum('status').notNull().default('DRAFT'),
    config: jsonb('config').$type<RestaurantWebsiteConfig>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('website_versions_version_positive', sql`${table.version} > 0`),
    uniqueIndex('website_versions_website_version_unique').on(
      table.websiteId,
      table.version,
    ),
    uniqueIndex('website_versions_agent_job_unique').on(table.agentJobId),
    index('website_versions_website_created_at_idx').on(
      table.websiteId,
      table.createdAt,
    ),
  ],
);

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
export type WebsiteVersion = typeof websiteVersions.$inferSelect;
export type NewWebsiteVersion = typeof websiteVersions.$inferInsert;
