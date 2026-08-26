import type { AgentJobStatus } from '@ai-web-agency/shared';
import { sql } from 'drizzle-orm';
import {
  check,
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

export const DATABASE_AGENT_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'NEEDS_REVIEW',
] as const satisfies readonly AgentJobStatus[];

export const agentJobStatusEnum = pgEnum(
  'agent_job_status',
  DATABASE_AGENT_JOB_STATUSES,
);

export const agentJobs = pgTable(
  'agent_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 100 }).notNull(),
    agent: varchar('agent', { length: 80 }),
    entityType: varchar('entity_type', { length: 80 }),
    entityId: uuid('entity_id'),
    correlationId: uuid('correlation_id'),
    priority: integer('priority').notNull().default(0),
    status: agentJobStatusEnum('status').notNull().default('PENDING'),
    queueName: varchar('queue_name', { length: 100 }),
    queueJobId: varchar('queue_job_id', { length: 255 }),
    input: jsonb('input').$type<Record<string, unknown>>().notNull(),
    output: jsonb('output').$type<Record<string, unknown>>(),
    error: text('error'),
    attempt: integer('attempt').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('agent_jobs_attempt_nonnegative', sql`${table.attempt} >= 0`),
    index('agent_jobs_status_created_at_idx').on(table.status, table.createdAt),
    uniqueIndex('agent_jobs_queue_identity_idx').on(
      table.queueName,
      table.queueJobId,
    ),
  ],
);

export type AgentJob = typeof agentJobs.$inferSelect;
export type NewAgentJob = typeof agentJobs.$inferInsert;
