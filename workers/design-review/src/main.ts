import { AIClient, createAIProviderFromEnvironment } from '@ai-web-agency/ai';
import { PlaywrightWebsiteReviewer } from '@ai-web-agency/browser';
import {
  AICallRepository,
  AgentJobRepository,
  createDatabaseClient,
  DesignReviewRepository,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createDesignReviewWorker } from './worker.js';

function defaultArtifactsRoot(): string {
  let directory = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    if (existsSync(path.join(directory, 'pnpm-workspace.yaml')))
      return path.join(directory, 'artifacts');
    directory = path.dirname(directory);
  }
  throw new Error('Monorepo root not found');
}

const client = createDatabaseClient();
const aiCalls = new AICallRepository(client.db);
const ai = new AIClient(createAIProviderFromEnvironment(process.env), {
  record: (record) => aiCalls.record(record).then(() => undefined),
});
const worker = createDesignReviewWorker(
  {
    agentJobs: new AgentJobRepository(client.db),
    websites: new WebsiteRepository(client.db),
    designReviews: new DesignReviewRepository(client.db),
  },
  ai,
  new PlaywrightWebsiteReviewer(),
  {
    previewBaseUrl: process.env.PREVIEW_BASE_URL ?? 'http://localhost:3002',
    artifactsRoot: path.resolve(
      process.env.ARTIFACTS_ROOT ?? defaultArtifactsRoot(),
    ),
  },
);
worker.on('error', () =>
  console.error('Design review worker encountered an infrastructure error'),
);
let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await worker.close();
  await client.close();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
