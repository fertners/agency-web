import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './src/environment.js';

config({ path: '../../.env', quiet: true });
config({ path: '../../.env.example', quiet: true });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  strict: true,
  verbose: true,
});
