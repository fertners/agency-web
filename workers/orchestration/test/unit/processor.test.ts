import type {
  ProspectWorkflowJobPayload,
  ProspectWorkflowJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { createProspectWorkflowProcessor } from '../../src/processor.js';

describe('prospect workflow processor', () => {
  it('records an actionable failure when an internal step fails', async () => {
    const repository = {
      markRunning: vi.fn(),
      updateOutput: vi.fn(),
      markCompleted: vi.fn(),
      markFailed: vi.fn(),
    };
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Generation unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    const processor = createProspectWorkflowProcessor(repository, {
      apiBaseUrl: 'http://127.0.0.1:3001',
      fetcher,
      pollIntervalMs: 1,
      timeoutMs: 10,
    });
    const job = {
      id: crypto.randomUUID(),
      data: {
        prospectId: crypto.randomUUID(),
        websiteType: 'SHOWCASE',
        currency: 'EUR',
        timelineDays: 21,
        scope: ['Site vitrine'],
      },
    } as unknown as Job<ProspectWorkflowJobPayload, ProspectWorkflowJobResult>;

    await expect(processor(job)).rejects.toThrow('Generation unavailable');
    expect(repository.markRunning).toHaveBeenCalledWith(job.id, 1);
    expect(repository.markFailed).toHaveBeenCalledWith(
      job.id,
      1,
      'Prospect workflow failed: Generation unavailable',
    );
  });
});
