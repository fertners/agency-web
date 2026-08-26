import {
  AgentJobRepository,
  createDatabaseClient,
  DeliveryRepository,
} from '@ai-web-agency/database';
import { LocalDeploymentProvider } from './provider.js';
import { createDeploymentWorker } from './worker.js';

const client = createDatabaseClient();
const worker = createDeploymentWorker(
  {
    agentJobs: new AgentJobRepository(client.db),
    delivery: new DeliveryRepository(client.db),
  },
  new LocalDeploymentProvider(process.env.PREVIEW_BASE_URL),
);
worker.on('error', () =>
  console.error('Deployment worker encountered an infrastructure error'),
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
