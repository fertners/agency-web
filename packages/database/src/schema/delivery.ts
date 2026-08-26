import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agentJobs } from './agent-jobs.js';
import { proposals } from './commercial.js';
import { companies, prospects } from './prospects.js';
import { websites, websiteVersions } from './websites.js';

export const clientStatusEnum = pgEnum('client_status', [
  'ONBOARDING',
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
  'COMPLETED',
  'INACTIVE',
]);
export const projectStatusEnum = pgEnum('project_status', [
  'PLANNED',
  'ACTIVE',
  'DELIVERED',
  'ARCHIVED',
]);
export const deploymentEnvironmentEnum = pgEnum('deployment_environment', [
  'PREVIEW',
  'PRODUCTION',
]);
export const deploymentStatusEnum = pgEnum('deployment_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'ROLLED_BACK',
]);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'restrict' }),
    companyId: uuid('company_id').references(() => companies.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    status: clientStatusEnum('status').notNull().default('ACTIVE'),
    convertedAt: timestamp('converted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('clients_prospect_unique').on(table.prospectId)],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    status: projectStatusEnum('status').notNull().default('PLANNED'),
    websiteId: uuid('website_id').references(() => websites.id, {
      onDelete: 'set null',
    }),
    versionId: uuid('version_id').references(() => websiteVersions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('projects_proposal_unique').on(table.proposalId),
    index('projects_client_idx').on(table.clientId),
  ],
);

export const deployments = pgTable(
  'deployments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    websiteId: uuid('website_id')
      .notNull()
      .references(() => websites.id, { onDelete: 'restrict' }),
    versionId: uuid('version_id')
      .notNull()
      .references(() => websiteVersions.id, { onDelete: 'restrict' }),
    agentJobId: uuid('agent_job_id').references(() => agentJobs.id, {
      onDelete: 'set null',
    }),
    environment: deploymentEnvironmentEnum('environment').notNull(),
    status: deploymentStatusEnum('status').notNull().default('PENDING'),
    provider: varchar('provider', { length: 80 })
      .notNull()
      .default('local-preview'),
    url: text('url'),
    isActive: boolean('is_active').notNull().default(false),
    replacesDeploymentId: uuid('replaces_deployment_id'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('deployments_agent_job_unique').on(table.agentJobId),
    index('deployments_project_created_idx').on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

export type ClientRow = typeof clients.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type DeploymentRow = typeof deployments.$inferSelect;
