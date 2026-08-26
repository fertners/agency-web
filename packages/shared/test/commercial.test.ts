import { describe, expect, it } from 'vitest';
import {
  isProspectTransitionAllowed,
  createProposalRequestSchema,
  draftStatusSchema,
  prospectStatusSchema,
  proposalStatusSchema,
  publicProposalDecisionSchema,
} from '../src/index.js';

describe('Phase 6 commercial contracts', () => {
  it('supports the qualified commercial lifecycle', () => {
    expect(prospectStatusSchema.parse('CONTACT_READY')).toBe('CONTACT_READY');
    expect(prospectStatusSchema.parse('CONVERTED')).toBe('CONVERTED');
  });

  it('does not expose an automated sent status', () => {
    expect(proposalStatusSchema.safeParse('SENT').success).toBe(false);
    expect(draftStatusSchema.safeParse('SENT').success).toBe(false);
  });

  it('normalizes proposal currency and validates scope', () => {
    expect(
      createProposalRequestSchema.parse({
        priceCents: 250000,
        currency: 'eur',
        timelineDays: 21,
        scope: ['Site responsive'],
      }).currency,
    ).toBe('EUR');
  });

  it('only permits declared prospect status transitions', () => {
    expect(isProspectTransitionAllowed('DISCOVERED', 'ANALYZING')).toBe(true);
    expect(isProspectTransitionAllowed('DISCOVERED', 'WON')).toBe(false);
    expect(isProspectTransitionAllowed('WON', 'DISCOVERED')).toBe(false);
  });

  it('only accepts explicit public proposal decisions', () => {
    expect(
      publicProposalDecisionSchema.parse({ decision: 'accept' }).decision,
    ).toBe('accept');
    expect(
      publicProposalDecisionSchema.safeParse({ decision: 'unsubscribe' })
        .success,
    ).toBe(false);
  });
});
