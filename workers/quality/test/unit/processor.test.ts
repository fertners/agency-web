import { describe, expect, it } from 'vitest';
import { createQualityProcessor } from '../../src/processor.js';
describe('quality processor', () => {
  it('exposes the quality workflow factory', () => {
    expect(createQualityProcessor).toBeTypeOf('function');
  });
});
