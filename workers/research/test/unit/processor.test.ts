import { describe, expect, it, vi } from 'vitest';
import { LocalBusinessSearchProvider } from '@ai-web-agency/prospects';
import { createResearchProcessor } from '../../src/processor.js';
describe('research processor', () => {
  it('persists scored candidates and completes the job', async () => {
    const repositories = {
      agentJobs: {
        markRunning: vi.fn(),
        markCompleted: vi.fn(),
        markPendingRetry: vi.fn(),
        markFailed: vi.fn(),
      },
      prospects: { upsert: vi.fn().mockResolvedValue({ created: true }) },
    };
    const processor = createResearchProcessor(
      repositories,
      new LocalBusinessSearchProvider(),
    );
    const result = await processor({
      id: '901998c6-5bb2-4e88-8c6c-6f88d34a8212',
      data: {
        city: 'Lyon',
        countryCode: 'FR',
        category: 'RESTAURANT',
        limit: 2,
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as never);
    expect(result.created).toBe(2);
    expect(repositories.prospects.upsert).toHaveBeenCalledTimes(2);
  });
});
