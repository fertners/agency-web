import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';

import { createDatabaseClient } from './client.js';

const migrationsFolder = fileURLToPath(
  new URL('../migrations', import.meta.url),
);
const client = createDatabaseClient({ maxConnections: 1 });

try {
  await migrate(client.db, { migrationsFolder });
} finally {
  await client.close();
}
