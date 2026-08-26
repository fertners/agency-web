import type {
  CompanyCandidate,
  OpportunityAssessment,
} from '@ai-web-agency/shared';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const prospectStatusEnum = pgEnum('prospect_status', [
  'NEW',
  'QUALIFIED',
  'CONTACT_READY',
  'CONTACTED',
  'RESPONDED',
  'CONVERTED',
  'DISMISSED',
]);
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fingerprint: text('fingerprint').notNull(),
    source: varchar('source', { length: 80 }).notNull(),
    externalId: text('external_id'),
    name: text('name').notNull(),
    category: varchar('category', { length: 40 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    city: text('city').notNull(),
    street: text('street'),
    postalCode: text('postal_code'),
    websiteUrl: text('website_url'),
    email: text('email'),
    phone: text('phone'),
    raw: jsonb('raw').$type<CompanyCandidate>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('companies_fingerprint_unique').on(table.fingerprint),
    index('companies_location_category_idx').on(
      table.countryCode,
      table.city,
      table.category,
    ),
  ],
);

export const prospects = pgTable(
  'prospects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    status: prospectStatusEnum('status').notNull().default('NEW'),
    opportunityScore: integer('opportunity_score'),
    assessment: jsonb('assessment').$type<OpportunityAssessment>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('prospects_company_unique').on(table.companyId),
    index('prospects_score_idx').on(table.opportunityScore),
  ],
);
export type CompanyRow = typeof companies.$inferSelect;
export type ProspectRow = typeof prospects.$inferSelect;
