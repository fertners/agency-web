'use server';

import { proposalDecisionRequestSchema } from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import { decideProposal } from '@/lib/api';

export async function decideProposalAction(
  id: string,
  decision: 'approve' | 'reject',
) {
  await decideProposal(id, proposalDecisionRequestSchema.parse({ decision }));
  revalidatePath('/proposals');
}
