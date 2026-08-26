import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PlaywrightWebsiteReviewer } from '../src/index.js';

describe('PlaywrightWebsiteReviewer', () => {
  it('rejects arbitrary external URLs before launching Chromium', async () => {
    await expect(
      new PlaywrightWebsiteReviewer().review({
        url: 'https://example.com',
        websiteId: randomUUID(),
        versionId: randomUUID(),
        artifactsRoot: 'artifacts',
      }),
    ).rejects.toThrow('Only local preview URLs are allowed');
  });
});
