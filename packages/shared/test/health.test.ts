import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from '../src/index.js';

describe('healthResponseSchema', () => {
  it('accepts a complete healthy response', () => {
    const result = healthResponseSchema.safeParse({
      status: 'UP',
      timestamp: '2026-08-25T12:00:00.000Z',
      services: {
        api: { status: 'UP', latencyMs: 1 },
        postgres: { status: 'UP', latencyMs: 5 },
        redis: { status: 'UP', latencyMs: 2 },
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown services and invalid latencies', () => {
    const result = healthResponseSchema.safeParse({
      status: 'UP',
      timestamp: '2026-08-25T12:00:00.000Z',
      services: {
        api: { status: 'UP', latencyMs: -1 },
        postgres: { status: 'UP' },
        redis: { status: 'UP' },
        unexpected: { status: 'UP' },
      },
    });

    expect(result.success).toBe(false);
  });
});
