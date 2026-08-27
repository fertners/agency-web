'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getSettings, updateSettings } from '@/lib/api';

export type ProposalMessageTemplate = Readonly<{
  id: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: string;
}>;
const settingKey = 'commercial.proposal_message_templates';

function parseTemplates(value: unknown): ProposalMessageTemplate[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: unknown[] = parsed;
    return items.filter((item): item is ProposalMessageTemplate => {
      if (typeof item !== 'object' || item === null) return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.id === 'string' &&
        typeof record.name === 'string' &&
        typeof record.subject === 'string' &&
        typeof record.body === 'string' &&
        typeof record.updatedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

export async function getProposalMessageTemplates(): Promise<
  ProposalMessageTemplate[]
> {
  const response = await getSettings();
  return parseTemplates(
    response.settings.find(({ key }) => key === settingKey)?.value,
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveProposalMessageTemplateAction(input: {
  id?: string;
  name: string;
  subject: string;
  body: string;
}) {
  const name = input.name.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!name || !subject || !body)
    return {
      ok: false as const,
      message: 'Tous les champs sont obligatoires.',
    };
  const current = await getSettings();
  const templates = parseTemplates(
    current.settings.find(({ key }) => key === settingKey)?.value,
  );
  const now = new Date().toISOString();
  const next = input.id
    ? templates.map((template) =>
        template.id === input.id
          ? { ...template, name, subject, body, updatedAt: now }
          : template,
      )
    : [...templates, { id: randomUUID(), name, subject, body, updatedAt: now }];
  await updateSettings({
    settings: [
      {
        key: settingKey,
        section: 'Communication',
        value: JSON.stringify(next),
      },
    ],
  });
  revalidatePath('/proposals');
  return {
    ok: true as const,
    message: input.id ? 'Canevas modifié.' : 'Canevas créé.',
  };
}

export async function deleteProposalMessageTemplateAction(id: string) {
  const current = await getSettings();
  const templates = parseTemplates(
    current.settings.find(({ key }) => key === settingKey)?.value,
  );
  await updateSettings({
    settings: [
      {
        key: settingKey,
        section: 'Communication',
        value: JSON.stringify(
          templates.filter((template) => template.id !== id),
        ),
      },
    ],
  });
  revalidatePath('/proposals');
  return { ok: true as const, message: 'Canevas supprimé.' };
}
