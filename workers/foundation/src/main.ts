import {
  AgentJobRepository,
  createDatabaseClient,
} from '@ai-web-agency/database';

import { createFoundationWorker } from './worker.js';

const databaseClient = createDatabaseClient();
const repository = new AgentJobRepository(databaseClient.db);
const worker = createFoundationWorker(repository);

worker.on('error', () => {
  console.error('Foundation worker encountered an infrastructure error');
});

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await worker.close();
  await databaseClient.close();
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
