import {
  boolean,
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

import { agentJobs } from './agent-jobs.js';
import { conversations } from './commercial.js';
import { clients, projects } from './delivery.js';
import { websites, websiteVersions } from './websites.js';

export const templateStatusEnum = pgEnum('template_status', [
  'DRAFT',
  'ACTIVE',
  'DEPRECATED',
  'ARCHIVED',
]);
export const clientRequestStatusEnum = pgEnum('client_request_status', [
  'NEW',
  'ANALYZING',
  'PLANNED',
  'IN_PROGRESS',
  'NEEDS_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
]);
export const messageDirectionEnum = pgEnum('message_direction', [
  'INBOUND',
  'OUTBOUND',
  'INTERNAL',
]);
export const jobLogLevelEnum = pgEnum('job_log_level', [
  'DEBUG',
  'INFO',
  'WARNING',
  'ERROR',
]);

export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }).notNull(),
    name: text('name').notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    version: integer('version').notNull(),
    status: templateStatusEnum('status').notNull().default('DRAFT'),
    sections: jsonb('sections').$type<string[]>().notNull(),
    designTokens: jsonb('design_tokens')
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('templates_key_version_unique').on(table.key, table.version),
    index('templates_category_status_idx').on(table.category, table.status),
  ],
);

export const clientRequests = pgTable(
  'client_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    websiteId: uuid('website_id').references(() => websites.id, {
      onDelete: 'set null',
    }),
    sourceVersionId: uuid('source_version_id').references(
      () => websiteVersions.id,
      { onDelete: 'set null' },
    ),
    resultVersionId: uuid('result_version_id').references(
      () => websiteVersions.id,
      { onDelete: 'set null' },
    ),
    status: clientRequestStatusEnum('status').notNull().default('NEW'),
    request: text('request').notNull(),
    analysis: jsonb('analysis').$type<Record<string, unknown>>(),
    modificationPlan:
      jsonb('modification_plan').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('client_requests_client_status_idx').on(table.clientId, table.status),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    provider: varchar('provider', { length: 80 }).notNull(),
    externalReference: text('external_reference'),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('payments_client_created_idx').on(table.clientId, table.createdAt),
  ],
);

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    direction: messageDirectionEnum('direction').notNull(),
    body: text('body').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('conversation_messages_conversation_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const agentJobLogs = pgTable(
  'agent_job_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => agentJobs.id, { onDelete: 'cascade' }),
    level: jobLogLevelEnum('level').notNull(),
    agent: varchar('agent', { length: 80 }).notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('agent_job_logs_job_created_idx').on(table.jobId, table.createdAt),
  ],
);

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 120 }).primaryKey(),
  section: varchar('section', { length: 50 }).notNull(),
  value: jsonb('value').$type<unknown>().notNull(),
  isSensitive: boolean('is_sensitive').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TemplateRow = typeof templates.$inferSelect;
export type ClientRequestRow = typeof clientRequests.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;
export type AgentJobLogRow = typeof agentJobLogs.$inferSelect;
export type AppSettingRow = typeof appSettings.$inferSelect;
