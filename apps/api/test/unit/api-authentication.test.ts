import { describe, expect, it, vi } from 'vitest';

import { createApiAuthenticationMiddleware } from '../../src/security/api-authentication.js';

function response() {
  const target = {
    status: vi.fn(),
    json: vi.fn(),
  };
  target.status.mockReturnValue(target);
  return target;
}

describe('API authentication middleware', () => {
  it('keeps public proposals accessible', () => {
    const middleware = createApiAuthenticationMiddleware({
      ADMIN_API_TOKEN: 'admin-secret',
    });
    const next = vi.fn();
    middleware(
      { method: 'GET', path: '/public/proposals/token', headers: {} },
      response(),
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects an unauthenticated private route', () => {
    const middleware = createApiAuthenticationMiddleware({
      ADMIN_API_TOKEN: 'admin-secret',
    });
    const target = response();
    middleware(
      { method: 'GET', path: '/prospects', headers: {} },
      target,
      vi.fn(),
    );
    expect(target.status).toHaveBeenCalledWith(401);
  });

  it('prevents an operator from modifying critical settings', () => {
    const middleware = createApiAuthenticationMiddleware({
      ADMIN_API_TOKEN: 'admin-secret',
      OPERATOR_API_TOKEN: 'operator-secret',
    });
    const target = response();
    middleware(
      {
        method: 'PATCH',
        path: '/settings',
        headers: { authorization: 'Bearer operator-secret' },
      },
      target,
      vi.fn(),
    );
    expect(target.status).toHaveBeenCalledWith(403);
  });
});
