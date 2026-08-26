import { describe, expect, it } from 'vitest';

import {
  agentJobStatusSchema,
  createDiagnosticJobResponseSchema,
  diagnosticJobPayloadSchema,
} from '../src/index.js';

describe('job contracts', () => {
  it('accepts every supported durable job status', () => {
    const statuses = [
      'PENDING',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'NEEDS_REVIEW',
    ];

    for (const status of statuses) {
      expect(agentJobStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects additional diagnostic payload fields', () => {
    const result = diagnosticJobPayloadSchema.safeParse({
      requestedAt: '2026-08-25T12:00:00.000Z',
      command: 'arbitrary-command',
    });

    expect(result.success).toBe(false);
  });

  it('only returns newly-created jobs as pending', () => {
    const validId = '68e6bc1f-e7aa-4a1a-b09b-11791b81f753';

    expect(
      createDiagnosticJobResponseSchema.safeParse({
        jobId: validId,
        status: 'PENDING',
      }).success,
    ).toBe(true);
    expect(
      createDiagnosticJobResponseSchema.safeParse({
        jobId: validId,
        status: 'COMPLETED',
      }).success,
    ).toBe(false);
  });
});
