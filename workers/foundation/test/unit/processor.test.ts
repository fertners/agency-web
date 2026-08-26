import { describe, expect, it } from 'vitest';

import type { DiagnosticHandler } from '../../src/processor.js';

describe('DiagnosticHandler', () => {
  it('keeps handler output structured', async () => {
    const handler: DiagnosticHandler = () =>
      Promise.resolve({
        processedAt: '2026-08-25T12:00:00.000Z',
        worker: 'foundation',
      });

    await expect(
      handler({ requestedAt: '2026-08-25T11:59:00.000Z' }),
    ).resolves.toMatchObject({ worker: 'foundation' });
  });
});
