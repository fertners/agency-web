import { describe, expect, it } from 'vitest';

import {
  createRedisConnection,
  DIAGNOSTIC_JOB_ATTEMPTS,
  DIAGNOSTIC_JOB_OPTIONS,
} from '../src/index.js';

describe('queue configuration', () => {
  it('keeps diagnostic retries bounded', () => {
    expect(DIAGNOSTIC_JOB_ATTEMPTS).toBe(3);
    expect(DIAGNOSTIC_JOB_OPTIONS).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 500 },
    });
  });

  it('parses authenticated TLS Redis URLs', () => {
    expect(
      createRedisConnection('rediss://worker:secret@example.com:6380/2'),
    ).toMatchObject({
      host: 'example.com',
      port: 6380,
      username: 'worker',
      password: 'secret',
      db: 2,
      tls: {},
    });
  });
});
