import { PlaywrightQualityAuditor } from '@ai-web-agency/browser';
import {
  AgentJobRepository,
  createDatabaseClient,
  QualityReportRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { createQualityWorker } from './worker.js';
const client = createDatabaseClient();
const worker = createQualityWorker(
  {
    agentJobs: new AgentJobRepository(client.db),
    websites: new WebsiteRepository(client.db),
    qualityReports: new QualityReportRepository(client.db),
  },
  new PlaywrightQualityAuditor(),
);
worker.on('error', () =>
  console.error('Quality worker encountered an infrastructure error'),
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
