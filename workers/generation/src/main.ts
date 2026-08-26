import { AIClient, createAIProviderFromEnvironment } from '@ai-web-agency/ai';
import {
  AICallRepository,
  AgentJobRepository,
  createDatabaseClient,
  WebsiteRepository,
} from '@ai-web-agency/database';

import { createGenerationWorker } from './worker.js';

const databaseClient = createDatabaseClient();
const aiCalls = new AICallRepository(databaseClient.db);
const ai = new AIClient(createAIProviderFromEnvironment(process.env), {
  record: (record) => aiCalls.record(record).then(() => undefined),
});
const worker = createGenerationWorker(
  {
    agentJobs: new AgentJobRepository(databaseClient.db),
    websites: new WebsiteRepository(databaseClient.db),
  },
  ai,
);

worker.on('error', () => {
  console.error('Generation worker encountered an infrastructure error');
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
