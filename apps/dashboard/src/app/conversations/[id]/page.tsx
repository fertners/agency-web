import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getConversation } from '@/lib/api';
import { decideDraftAction } from '../actions';

export const dynamic = 'force-dynamic';
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id).catch(() => null);
  if (!conversation) notFound();
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/conversations">
        ← Conversations
      </a>
      <header className="my-6">
        <p className="text-sm font-semibold text-violet-600">
          INBOX · {conversation.status}
        </p>
        <h1 className="text-3xl font-bold">{conversation.prospectName}</h1>
        <p className="mt-2 text-slate-500">
          Intent {conversation.intent ?? 'non analysé'} · priorité{' '}
          {conversation.priority}
        </p>
      </header>
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Historique</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversation.messages.length ? (
              conversation.messages.map((message) => (
                <div
                  className={`rounded-xl p-4 text-sm ${message.direction === 'INBOUND' ? 'bg-slate-100' : 'bg-violet-50'}`}
                  key={message.id}
                >
                  <p className="mb-1 text-xs font-semibold text-slate-500">
                    {message.direction} ·{' '}
                    {new Date(message.createdAt).toLocaleString('fr-FR')}
                  </p>
                  <p>{message.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Aucun message reçu. Les brouillons ne sont jamais envoyés
                automatiquement.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Contexte IA limité</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <b>Résumé :</b> {conversation.summary ?? '—'}
              </p>
              <p>
                <b>Action recommandée :</b>{' '}
                {conversation.recommendedAction ?? '—'}
              </p>
              <p>
                <b>Company :</b> {conversation.companyId ?? '—'}
              </p>
              <p>
                <b>Client :</b> {conversation.clientId ?? 'Non'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Suggested responses</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversation.drafts.map((draft) => (
                <div className="rounded-xl border p-3 text-sm" key={draft.id}>
                  <p className="font-semibold">
                    {draft.subject ?? draft.channel}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{draft.body}</p>
                  {draft.status === 'DRAFT' && (
                    <div className="mt-3 flex gap-2">
                      <form
                        action={decideDraftAction.bind(
                          null,
                          draft.id,
                          'approve',
                        )}
                      >
                        <button className="font-semibold text-emerald-700">
                          Approve
                        </button>
                      </form>
                      <form
                        action={decideDraftAction.bind(
                          null,
                          draft.id,
                          'reject',
                        )}
                      >
                        <button className="font-semibold text-rose-700">
                          Discard
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
