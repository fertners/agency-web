import { describe, expect, it } from 'vitest';

import { loadApiEnvironment } from '../../src/config/environment.js';

describe('loadApiEnvironment', () => {
  it('provides safe local defaults', () => {
    expect(loadApiEnvironment({})).toEqual({
      host: '127.0.0.1',
      port: 3001,
      redisUrl: 'redis://localhost:6379',
    });
  });

  it('coerces a configured port', () => {
    expect(loadApiEnvironment({ API_PORT: '4100' }).port).toBe(4100);
  });

  it('rejects non-Redis URLs', () => {
    expect(() =>
      loadApiEnvironment({ REDIS_URL: 'https://redis.example.com' }),
    ).toThrow();
  });
});
