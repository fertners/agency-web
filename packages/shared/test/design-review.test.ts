import { describe, expect, it } from 'vitest';
import {
  DESIGN_REVIEW_MAX_ITERATIONS,
  designReviewJobPayloadSchema,
  designReviewResultSchema,
} from '../src/index.js';

describe('design review contracts', () => {
  it('limits review iterations to three', () => {
    expect(DESIGN_REVIEW_MAX_ITERATIONS).toBe(3);
    expect(
      designReviewJobPayloadSchema.safeParse({
        websiteId: crypto.randomUUID(),
        versionId: crypto.randomUUID(),
        iteration: 4,
      }).success,
    ).toBe(false);
  });
  it('rejects scores outside the accepted range', () => {
    expect(
      designReviewResultSchema.safeParse({
        score: 101,
        categories: {},
        issues: [],
        summary: 'Invalid',
      }).success,
    ).toBe(false);
  });
});
