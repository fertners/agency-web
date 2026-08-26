'use server';

import {
  createDraftRequestSchema,
  createProposalRequestSchema,
  createProspectNoteRequestSchema,
  updateProspectStatusRequestSchema,
} from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import {
  addProspectNote,
  createConversationDraft,
  createProposal,
  convertProspect,
  updateProspectStatus,
  generateWebsiteFromProspect,
} from '@/lib/api';

export async function updateStatusAction(id: string, formData: FormData) {
  await updateProspectStatus(
    id,
    updateProspectStatusRequestSchema.parse({
      status: formData.get('status'),
      note: formData.get('note') || undefined,
    }),
  );
  revalidatePath(`/prospects/${id}`);
  revalidatePath('/prospects');
}

export async function addNoteAction(id: string, formData: FormData) {
  await addProspectNote(
    id,
    createProspectNoteRequestSchema.parse({ content: formData.get('content') }),
  );
  revalidatePath(`/prospects/${id}`);
}

export async function createProposalAction(id: string, formData: FormData) {
  const scopeValue = formData.get('scope');
  await createProposal(
    id,
    createProposalRequestSchema.parse({
      websiteType: formData.get('websiteType'),
      currency: 'EUR',
      timelineDays: formData.get('timelineDays'),
      scope: (typeof scopeValue === 'string' ? scopeValue : '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    }),
  );
  revalidatePath(`/prospects/${id}`);
  revalidatePath('/proposals');
}

export async function createDraftAction(id: string) {
  await createConversationDraft(
    id,
    createDraftRequestSchema.parse({ channel: 'EMAIL' }),
  );
  revalidatePath('/conversations');
}

export async function convertProspectAction(id: string, proposalId: string) {
  await convertProspect(id, { proposalId });
  revalidatePath(`/prospects/${id}`);
  revalidatePath('/clients');
}

export async function generateWebsiteAction(id: string) {
  await generateWebsiteFromProspect(id);
  revalidatePath(`/prospects/${id}`);
  revalidatePath('/websites');
}
