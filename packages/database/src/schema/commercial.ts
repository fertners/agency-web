import type { ProspectStatus } from '@ai-web-agency/shared';
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
import { prospects } from './prospects.js';

export const proposalStatusEnum = pgEnum('proposal_status', [
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
]);
export const proposalResponseEnum = pgEnum('proposal_response', [
  'ACCEPTED',
  'DECLINED',
]);
export const conversationStatusEnum = pgEnum('conversation_status', [
  'UNREAD',
  'OPEN',
  'WAITING',
  'REPLIED',
  'CLOSED',
]);
export const conversationIntentEnum = pgEnum('conversation_intent', [
  'QUESTION',
  'PRICE',
  'DESIGN_REQUEST',
  'SEO_REQUEST',
  'INTERESTED',
  'NOT_INTERESTED',
  'SUPPORT',
  'OTHER',
]);
export const communicationChannelEnum = pgEnum('communication_channel', [
  'EMAIL',
  'PHONE_NOTE',
  'MANUAL',
]);
export const draftStatusEnum = pgEnum('draft_status', [
  'DRAFT',
  'APPROVED',
  'REJECTED',
]);

export const prospectStatusHistory = pgTable(
  'prospect_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    fromStatus: varchar('from_status', { length: 40 }).$type<ProspectStatus>(),
    toStatus: varchar('to_status', { length: 40 })
      .$type<ProspectStatus>()
      .notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('prospect_status_history_prospect_idx').on(
      table.prospectId,
      table.createdAt,
    ),
  ],
);
export const prospectNotes = pgTable(
  'prospect_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('prospect_notes_prospect_idx').on(table.prospectId, table.createdAt),
  ],
);
export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: proposalStatusEnum('status').notNull().default('NEEDS_REVIEW'),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    message: text('message').notNull(),
    analysisIssues: jsonb('analysis_issues').$type<string[]>().notNull(),
    previewUrl: text('preview_url').notNull(),
    publicToken: varchar('public_token', { length: 64 }).notNull(),
    scope: jsonb('scope').$type<string[]>().notNull(),
    priceCents: integer('price_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    timelineDays: integer('timeline_days').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    response: proposalResponseEnum('response'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('proposals_prospect_version_unique').on(
      table.prospectId,
      table.version,
    ),
    index('proposals_status_updated_idx').on(table.status, table.updatedAt),
    uniqueIndex('proposals_public_token_unique').on(table.publicToken),
    index('proposals_expiry_idx').on(table.expiresAt, table.response),
  ],
);
export const contactSuppressions = pgTable(
  'contact_suppressions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityHash: varchar('identity_hash', { length: 64 }).notNull(),
    reason: varchar('reason', { length: 40 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    retainUntil: timestamp('retain_until', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('contact_suppressions_identity_unique').on(table.identityHash),
  ],
);
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id'),
    clientId: uuid('client_id'),
    status: conversationStatusEnum('status').notNull().default('OPEN'),
    intent: conversationIntentEnum('intent'),
    priority: integer('priority').notNull().default(0),
    unreadCount: integer('unread_count').notNull().default(0),
    summary: text('summary'),
    recommendedAction: text('recommended_action'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('conversations_prospect_unique').on(table.prospectId),
  ],
);
export const communicationDrafts = pgTable(
  'communication_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    channel: communicationChannelEnum('channel').notNull(),
    status: draftStatusEnum('status').notNull().default('DRAFT'),
    subject: text('subject'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('communication_drafts_conversation_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export type ProposalRow = typeof proposals.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type CommunicationDraftRow = typeof communicationDrafts.$inferSelect;
