'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/toast-provider';
import {
  deleteProposalMessageTemplateAction,
  saveProposalMessageTemplateAction,
  type ProposalMessageTemplate,
} from './actions';

const empty = { name: '', subject: '', body: '' };

export function ProposalTemplateManager({
  templates,
}: Readonly<{ templates: ProposalMessageTemplate[] }>) {
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState(empty);
  const [isPending, startTransition] = useTransition();
  const { notify } = useToast();
  function edit(template: ProposalMessageTemplate) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
  }
  function save() {
    startTransition(async () => {
      try {
        const result = await saveProposalMessageTemplateAction({
          ...form,
          ...(editingId ? { id: editingId } : {}),
        });
        notify(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
          setEditingId(undefined);
          setForm(empty);
          window.location.reload();
        }
      } catch {
        notify('L’enregistrement a échoué.', 'error');
      }
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      try {
        const result = await deleteProposalMessageTemplateAction(id);
        notify(result.message);
        window.location.reload();
      } catch {
        notify('La suppression a échoué.', 'error');
      }
    });
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          {editingId ? 'Modifier le canevas' : 'Nouveau canevas'}
        </h2>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Nom du canevas"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Objet pour {{companyName}}"
            value={form.subject}
            onChange={(event) =>
              setForm({ ...form, subject: event.target.value })
            }
          />
          <textarea
            className="min-h-64 w-full rounded-xl border px-3 py-2"
            placeholder="Utilisez {{companyName}}, {{proposalLink}} et {{previewUrl}}."
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              disabled={isPending}
              onClick={save}
              type="button"
            >
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
            {editingId && (
              <button
                className="rounded-xl border px-4 py-2"
                onClick={() => {
                  setEditingId(undefined);
                  setForm(empty);
                }}
                type="button"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-400">
            Aucun canevas. Le message interne par défaut sera utilisé.
          </div>
        ) : (
          templates.map((template, index) => (
            <article
              className="rounded-2xl border bg-white p-5 shadow-sm"
              key={template.id}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{template.name}</h2>
                    {index === 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Canevas utilisé
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {template.subject}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    onClick={() => edit(template)}
                    type="button"
                  >
                    Modifier
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700"
                    onClick={() => remove(template.id)}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {template.body}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
