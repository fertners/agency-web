import {
  healthResponseSchema,
  type HealthResponse,
  type ServiceHealth,
} from '@ai-web-agency/shared';
import { Inject, Injectable } from '@nestjs/common';

import {
  DATABASE_HEALTH_PROBE,
  REDIS_HEALTH_PROBE,
  type HealthProbe,
} from '../../infrastructure/health-probe.js';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_HEALTH_PROBE)
    private readonly database: HealthProbe,
    @Inject(REDIS_HEALTH_PROBE)
    private readonly redis: HealthProbe,
  ) {}

  async check(): Promise<HealthResponse> {
    const [postgres, redis] = await Promise.all([
      this.checkProbe(this.database),
      this.checkProbe(this.redis),
    ]);
    const status =
      postgres.status === 'UP' && redis.status === 'UP' ? 'UP' : 'DEGRADED';

    return healthResponseSchema.parse({
      status,
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'UP' },
        postgres,
        redis,
      },
    });
  }

  private async checkProbe(probe: HealthProbe): Promise<ServiceHealth> {
    const startedAt = performance.now();

    try {
      await probe.ping();
      return {
        status: 'UP',
        latencyMs: Math.max(0, performance.now() - startedAt),
      };
    } catch {
      return {
        status: 'DOWN',
        latencyMs: Math.max(0, performance.now() - startedAt),
        message: 'Dependency unavailable',
      };
    }
  }
}
