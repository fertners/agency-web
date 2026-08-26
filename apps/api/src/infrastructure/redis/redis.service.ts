import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

import { loadApiEnvironment } from '../../config/environment.js';
import type { HealthProbe } from '../health-probe.js';

@Injectable()
export class RedisService implements HealthProbe, OnApplicationShutdown {
  private readonly client: Redis;

  constructor() {
    const { redisUrl } = loadApiEnvironment();
    this.client = new Redis(redisUrl, {
      connectTimeout: 2_000,
      commandTimeout: 2_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 100, 1_000),
    });
    this.client.on('error', () => undefined);
  }

  async ping(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }

    const response = await this.client.ping();
    if (response !== 'PONG') {
      throw new Error('Redis returned an unexpected health response');
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.status === 'ready') {
      await this.client.quit();
      return;
    }

    this.client.disconnect();
  }
}
