'use server';

import { draftDecisionRequestSchema } from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import { decideDraft } from '@/lib/api';

export async function decideDraftAction(
  id: string,
  decision: 'approve' | 'reject',
) {
  await decideDraft(id, draftDecisionRequestSchema.parse({ decision }));
  revalidatePath('/conversations');
}
