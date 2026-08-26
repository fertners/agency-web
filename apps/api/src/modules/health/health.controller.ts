import type { HealthResponse } from '@ai-web-agency/shared';
import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';

import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const health = await this.healthService.check();

    if (health.status !== 'UP') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
