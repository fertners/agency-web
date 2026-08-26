import type {
  BrowserReviewReport,
  DesignReviewResult,
} from '@ai-web-agency/shared';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { agentJobs } from './agent-jobs.js';
import { websiteVersions } from './websites.js';

export const designReviewStatusEnum = pgEnum('design_review_status', [
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);
export const designReviews = pgTable(
  'design_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteVersionId: uuid('website_version_id')
      .notNull()
      .references(() => websiteVersions.id, { onDelete: 'cascade' }),
    correctedVersionId: uuid('corrected_version_id').references(
      () => websiteVersions.id,
      { onDelete: 'set null' },
    ),
    agentJobId: uuid('agent_job_id')
      .notNull()
      .references(() => agentJobs.id, { onDelete: 'cascade' }),
    iteration: integer('iteration').notNull(),
    status: designReviewStatusEnum('status').notNull().default('RUNNING'),
    browserReport: jsonb('browser_report').$type<BrowserReviewReport>(),
    result: jsonb('result').$type<DesignReviewResult>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('design_reviews_version_iteration_unique').on(
      table.websiteVersionId,
      table.iteration,
    ),
    index('design_reviews_version_created_idx').on(
      table.websiteVersionId,
      table.createdAt,
    ),
  ],
);
export type DesignReview = typeof designReviews.$inferSelect;
