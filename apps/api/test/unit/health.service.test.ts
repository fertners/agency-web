import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { HealthProbe } from '../../src/infrastructure/health-probe.js';
import { HealthController } from '../../src/modules/health/health.controller.js';
import { HealthService } from '../../src/modules/health/health.service.js';

function createProbe(error?: Error): HealthProbe {
  return {
    ping: vi.fn(() =>
      error === undefined ? Promise.resolve() : Promise.reject(error),
    ),
  };
}

describe('HealthService', () => {
  it('reports every dependency as up', async () => {
    const result = await new HealthService(
      createProbe(),
      createProbe(),
    ).check();

    expect(result.status).toBe('UP');
    expect(result.services.postgres.status).toBe('UP');
    expect(result.services.redis.status).toBe('UP');
  });

  it('returns a sanitized degraded response', async () => {
    const service = new HealthService(
      createProbe(new Error('postgresql://secret@database')),
      createProbe(),
    );
    const result = await service.check();

    expect(result.status).toBe('DEGRADED');
    expect(result.services.postgres).toMatchObject({
      status: 'DOWN',
      message: 'Dependency unavailable',
    });
    expect(JSON.stringify(result)).not.toContain('secret');
    await expect(new HealthController(service).check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
