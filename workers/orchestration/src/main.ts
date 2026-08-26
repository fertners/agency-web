import {
  AgentJobRepository,
  createDatabaseClient,
} from '@ai-web-agency/database';

import { createOrchestrationWorker } from './worker.js';

const databaseClient = createDatabaseClient();
const worker = createOrchestrationWorker(
  new AgentJobRepository(databaseClient.db),
  {
    apiBaseUrl: process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3001',
    ...(process.env.INTERNAL_API_TOKEN === undefined
      ? {}
      : { apiToken: process.env.INTERNAL_API_TOKEN }),
  },
);

worker.on('error', () =>
  console.error('Orchestration worker encountered an infrastructure error'),
);

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await worker.close();
  await databaseClient.close();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
