import { timingSafeEqual } from 'node:crypto';

type MinimalRequest = Readonly<{
  method: string;
  path: string;
  headers: Record<string, unknown>;
}>;
type MinimalResponse = {
  status(code: number): MinimalResponse;
  json(body: Record<string, unknown>): void;
};
type Next = () => void;

function equalSecret(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isPublic(request: MinimalRequest): boolean {
  if (request.method === 'OPTIONS') return true;
  if (request.method === 'GET' && request.path === '/health') return true;
  if (request.path.startsWith('/public/proposals/')) return true;
  return (
    request.method === 'GET' &&
    /^\/websites\/[^/]+\/versions\/[^/]+\/design-reviews\/[^/]+\/artifacts\/(desktop|mobile)$/.test(
      request.path,
    )
  );
}

function requiresAdmin(request: MinimalRequest): boolean {
  if (request.method === 'PATCH' && request.path === '/settings') return true;
  if (/^\/agent-jobs\/[^/]+\/(retry|cancel)$/.test(request.path)) return true;
  return request.method === 'POST' && request.path.includes('/deployments');
}

export function createApiAuthenticationMiddleware(environment: {
  NODE_ENV?: string;
  ADMIN_API_TOKEN?: string;
  OPERATOR_API_TOKEN?: string;
}) {
  const adminToken = environment.ADMIN_API_TOKEN?.trim();
  const operatorToken = environment.OPERATOR_API_TOKEN?.trim();
  const enabled = Boolean(adminToken || operatorToken);
  if (environment.NODE_ENV === 'production' && !adminToken)
    throw new Error('ADMIN_API_TOKEN is required in production');

  return (request: MinimalRequest, response: MinimalResponse, next: Next) => {
    if (!enabled || isPublic(request)) return next();
    const authorization = request.headers.authorization;
    const candidate =
      typeof authorization === 'string' && authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : '';
    const role =
      adminToken !== undefined && equalSecret(candidate, adminToken)
        ? 'ADMIN'
        : operatorToken !== undefined && equalSecret(candidate, operatorToken)
          ? 'OPERATOR'
          : null;
    if (role === null) {
      response.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (role !== 'ADMIN' && requiresAdmin(request)) {
      response.status(403).json({ message: 'Administrator role required' });
      return;
    }
    next();
  };
}
