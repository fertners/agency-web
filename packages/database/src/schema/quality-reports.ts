import type { QualityReport } from '@ai-web-agency/shared';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { agentJobs } from './agent-jobs.js';
import { websiteVersions } from './websites.js';
export const qualityReportStatusEnum = pgEnum('quality_report_status', [
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);
export const qualityReports = pgTable(
  'quality_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteVersionId: uuid('website_version_id')
      .notNull()
      .references(() => websiteVersions.id, { onDelete: 'cascade' }),
    agentJobId: uuid('agent_job_id')
      .notNull()
      .references(() => agentJobs.id, { onDelete: 'cascade' }),
    status: qualityReportStatusEnum('status').notNull().default('RUNNING'),
    report: jsonb('report').$type<QualityReport>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('quality_reports_job_unique').on(table.agentJobId),
    index('quality_reports_version_created_idx').on(
      table.websiteVersionId,
      table.createdAt,
    ),
  ],
);
export type QualityReportRow = typeof qualityReports.$inferSelect;
