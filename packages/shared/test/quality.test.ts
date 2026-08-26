import { describe, expect, it } from 'vitest';
import { qualityReportSchema } from '../src/index.js';
describe('quality contracts', () => {
  it('rejects scores above 100', () => {
    expect(
      qualityReportSchema.safeParse({
        score: 101,
        status: 'PASSED',
        seo: {},
        accessibility: {},
        performance: {},
        issues: [],
        summary: 'invalid',
      }).success,
    ).toBe(false);
  });
});
