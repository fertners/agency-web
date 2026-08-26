import { createHash } from 'node:crypto';

export function hashContactIdentity(fingerprint: string): string {
  return createHash('sha256')
    .update(fingerprint.trim().toLowerCase())
    .digest('hex');
}
