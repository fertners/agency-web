import { describe, expect, it, vi } from 'vitest';
import { createDeploymentProcessor } from '../../src/processor.js';

describe('deployment processor', () => {
  it('completes a local deployment and durable job', async () => {
    const repositories = {
      agentJobs: {
        markRunning: vi.fn(),
        markCompleted: vi.fn(),
        markPendingRetry: vi.fn(),
        markFailed: vi.fn(),
      },
      delivery: {
        markDeploymentRunning: vi.fn(),
        completeDeployment: vi.fn(),
        failDeployment: vi.fn(),
      },
    };
    const processor = createDeploymentProcessor(repositories, {
      deploy: vi
        .fn()
        .mockResolvedValue({ url: 'http://127.0.0.1:3002/preview/a/b' }),
    });
    const result = await processor({
      id: 'c7f8f68a-e8f5-4d70-a665-3567bc08bbd6',
      data: {
        deploymentId: '31b5c42c-1a51-48f1-99d0-e8f7f445383a',
        projectId: 'a6f0ef35-f0d7-4b63-97b4-7899dca6f561',
        websiteId: '27d59fde-e85a-47ea-bdf0-53281e19bc0f',
        versionId: 'b44e3fb6-d25d-483e-aa66-f95a7a8ed399',
        environment: 'PREVIEW',
      },
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as never);
    expect(result.status).toBe('COMPLETED');
    expect(repositories.delivery.completeDeployment).toHaveBeenCalledOnce();
  });
});
