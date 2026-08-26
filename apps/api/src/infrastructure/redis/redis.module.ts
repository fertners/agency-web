import { Module } from '@nestjs/common';

import { REDIS_HEALTH_PROBE } from '../health-probe.js';
import { RedisService } from './redis.service.js';

@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_HEALTH_PROBE,
      useExisting: RedisService,
    },
  ],
  exports: [RedisService, REDIS_HEALTH_PROBE],
})
export class RedisModule {}
