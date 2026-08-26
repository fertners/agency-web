'use server';

import { redirect } from 'next/navigation';
import { respondToPublicProposal } from '@/lib/api';

export async function respondAction(
  token: string,
  decision: 'accept' | 'decline',
) {
  const result = await respondToPublicProposal(token, decision);
  redirect(`/proposal/confirmation?decision=${result.decision}`);
}
