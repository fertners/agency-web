import { afterEach, describe, expect, it, vi } from 'vitest';

import { getWebsiteVersion } from './api';

describe('preview API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns undefined for a missing persisted version', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(
      getWebsiteVersion(
        '9b050e23-dda7-4aab-a98b-360aa6128ca7',
        'c7ab0567-5d8e-4a4e-8fbb-eb8e9a9d46f5',
      ),
    ).resolves.toBeUndefined();
  });
});
