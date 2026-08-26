import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { agentJobs } from './agent-jobs.js';

export const aiCalls = pgTable(
  'ai_calls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id').references(() => agentJobs.id, {
      onDelete: 'set null',
    }),
    provider: varchar('provider', { length: 100 }).notNull(),
    model: varchar('model', { length: 150 }).notNull(),
    context: varchar('context', { length: 150 }).notNull(),
    input: jsonb('input').$type<Record<string, unknown>>().notNull(),
    output: jsonb('output').$type<Record<string, unknown>>(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    costMicros: integer('cost_micros'),
    durationMs: integer('duration_ms').notNull(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('ai_calls_duration_nonnegative', sql`${table.durationMs} >= 0`),
    check(
      'ai_calls_tokens_cost_nonnegative',
      sql`(${table.inputTokens} is null or ${table.inputTokens} >= 0)
        and (${table.outputTokens} is null or ${table.outputTokens} >= 0)
        and (${table.costMicros} is null or ${table.costMicros} >= 0)`,
    ),
    index('ai_calls_job_created_at_idx').on(table.jobId, table.createdAt),
    index('ai_calls_provider_model_idx').on(table.provider, table.model),
  ],
);

export type AICall = typeof aiCalls.$inferSelect;
export type NewAICall = typeof aiCalls.$inferInsert;
