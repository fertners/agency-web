import {
  AGENT_JOB_STATUSES,
  WEBSITE_STATUSES,
  WEBSITE_VERSION_STATUSES,
} from '@ai-web-agency/shared';
import { describe, expect, it } from 'vitest';

import {
  DATABASE_AGENT_JOB_STATUSES,
  DATABASE_WEBSITE_STATUSES,
  DATABASE_WEBSITE_VERSION_STATUSES,
} from '../../src/index.js';

describe('database schema contracts', () => {
  it('keeps database job statuses aligned with the public contract', () => {
    expect(DATABASE_AGENT_JOB_STATUSES).toEqual(AGENT_JOB_STATUSES);
  });

  it('keeps website statuses aligned with the public contracts', () => {
    expect(DATABASE_WEBSITE_STATUSES).toEqual(WEBSITE_STATUSES);
    expect(DATABASE_WEBSITE_VERSION_STATUSES).toEqual(WEBSITE_VERSION_STATUSES);
  });
});
