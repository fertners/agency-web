import type { ConnectionOptions } from 'bullmq';
import { z } from 'zod';

const redisUrlSchema = z
  .string()
  .url()
  .refine((value) => ['redis:', 'rediss:'].includes(new URL(value).protocol), {
    message: 'Redis URL must use redis or rediss',
  });

export function getRedisUrl(environment = process.env): string {
  return redisUrlSchema.parse(
    environment.REDIS_URL ?? 'redis://localhost:6379',
  );
}

export function createRedisConnection(
  redisUrl = getRedisUrl(),
): ConnectionOptions {
  const url = new URL(redisUrlSchema.parse(redisUrl));
  const database = url.pathname.slice(1);

  return {
    host: url.hostname,
    port: url.port === '' ? 6379 : Number(url.port),
    ...(url.username === ''
      ? {}
      : { username: decodeURIComponent(url.username) }),
    ...(url.password === ''
      ? {}
      : { password: decodeURIComponent(url.password) }),
    ...(database === '' ? {} : { db: Number(database) }),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}
