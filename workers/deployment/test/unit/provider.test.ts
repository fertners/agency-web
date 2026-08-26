import { describe, expect, it } from 'vitest';

import { createDeploymentProvider } from '../../src/provider.js';

const websites = { findVersion: () => Promise.resolve(undefined) };

describe('deployment provider factory', () => {
  it('keeps local preview as the safe default', () => {
    expect(createDeploymentProvider(websites, {}).name).toBe('local-preview');
  });

  it('rejects Cloudflare activation without credentials', () => {
    expect(() =>
      createDeploymentProvider(websites, {
        DEPLOYMENT_PROVIDER: 'cloudflare-pages',
      }),
    ).toThrow();
  });

  it('creates the Cloudflare provider with validated credentials', () => {
    expect(
      createDeploymentProvider(websites, {
        DEPLOYMENT_PROVIDER: 'cloudflare-pages',
        CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
        CLOUDFLARE_API_TOKEN: 'token-with-more-than-twenty-characters',
        CLOUDFLARE_PAGES_PROJECT_PREFIX: 'agency-site',
      }).name,
    ).toBe('cloudflare-pages');
  });
});
