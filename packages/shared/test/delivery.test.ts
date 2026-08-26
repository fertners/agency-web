import { describe, expect, it } from 'vitest';
import {
  createDeploymentRequestSchema,
  deploymentJobPayloadSchema,
  deploymentStatusSchema,
} from '../src/index.js';

describe('Phase 7 delivery contracts', () => {
  it('defaults deployments to preview', () => {
    expect(createDeploymentRequestSchema.parse({}).environment).toBe('PREVIEW');
  });
  it('validates a durable deployment payload', () => {
    expect(
      deploymentJobPayloadSchema.parse({
        deploymentId: '31b5c42c-1a51-48f1-99d0-e8f7f445383a',
        projectId: 'a6f0ef35-f0d7-4b63-97b4-7899dca6f561',
        websiteId: '27d59fde-e85a-47ea-bdf0-53281e19bc0f',
        versionId: 'b44e3fb6-d25d-483e-aa66-f95a7a8ed399',
        environment: 'PREVIEW',
      }).environment,
    ).toBe('PREVIEW');
  });
  it('has an explicit rollback state', () => {
    expect(deploymentStatusSchema.parse('ROLLED_BACK')).toBe('ROLLED_BACK');
  });
});
