import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { getDatabaseUrl } from './environment.js';
import * as schema from './schema/index.js';

export type DatabaseClientOptions = Readonly<{
  connectionString?: string;
  maxConnections?: number;
}>;

export function createDatabaseClient(options: DatabaseClientOptions = {}) {
  const connectionString = getDatabaseUrl({
    DATABASE_URL: options.connectionString,
    NODE_ENV: process.env.NODE_ENV,
  });
  const pool = new Pool({
    connectionString,
    max: options.maxConnections ?? 10,
  });
  const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

  return {
    db,
    pool,
    close: async (): Promise<void> => pool.end(),
  };
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
export type Database = DatabaseClient['db'];
