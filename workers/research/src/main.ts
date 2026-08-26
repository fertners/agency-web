import {
  AgentJobRepository,
  createDatabaseClient,
  ProspectRepository,
} from '@ai-web-agency/database';
import {
  LocalBusinessSearchProvider,
  OverpassBusinessSearchProvider,
} from '@ai-web-agency/prospects';
import { createResearchWorker } from './worker.js';
const client = createDatabaseClient();
const worker = createResearchWorker(
  {
    agentJobs: new AgentJobRepository(client.db),
    prospects: new ProspectRepository(client.db),
  },
  process.env.BUSINESS_SEARCH_PROVIDER === 'local'
    ? new LocalBusinessSearchProvider()
    : new OverpassBusinessSearchProvider({
        ...(process.env.OVERPASS_API_URL
          ? { endpoint: process.env.OVERPASS_API_URL }
          : {}),
        ...(process.env.BUSINESS_SEARCH_USER_AGENT
          ? { userAgent: process.env.BUSINESS_SEARCH_USER_AGENT }
          : {}),
      }),
);
worker.on('error', () =>
  console.error('Research worker encountered an infrastructure error'),
);
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await worker.close();
  await client.close();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
