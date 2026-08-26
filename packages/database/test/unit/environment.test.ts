import { describe, expect, it } from 'vitest';

import { getDatabaseUrl, LOCAL_DATABASE_URL } from '../../src/index.js';

describe('getDatabaseUrl', () => {
  it('uses the configured PostgreSQL URL', () => {
    const url = 'postgresql://user:password@database:5432/app';

    expect(getDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });

  it('uses the local URL outside production', () => {
    expect(getDatabaseUrl({ NODE_ENV: 'test' })).toBe(LOCAL_DATABASE_URL);
  });

  it('requires an explicit URL in production', () => {
    expect(() => getDatabaseUrl({ NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL is required in production',
    );
  });

  it('rejects non-PostgreSQL protocols', () => {
    expect(() =>
      getDatabaseUrl({ DATABASE_URL: 'https://database.example.com' }),
    ).toThrow();
  });
});
