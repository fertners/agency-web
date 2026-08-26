import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getConversations } from '@/lib/api';
import { decideDraftAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const { conversations } = await getConversations().catch(() => ({
    conversations: [],
  }));
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/prospects" className="text-sm text-violet-700">
            ← Prospects
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-600">
            Phase 6 · Human in the loop
          </p>
          <h1 className="text-3xl font-semibold">Conversations</h1>
          <p className="text-slate-500">
            Brouillons internes uniquement. Aucun fournisseur d’envoi n’est
            configuré.
          </p>
        </div>
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Aucun brouillon.
            </CardContent>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <h2 className="font-semibold">{conversation.prospectName}</h2>
                  <Badge>{conversation.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversation.drafts.map((draft) => (
                  <div key={draft.id} className="rounded-xl border p-4">
                    <div className="flex justify-between">
                      <strong>{draft.subject ?? draft.channel}</strong>
                      <Badge>{draft.status}</Badge>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-600">
                      {draft.body}
                    </pre>
                    {draft.status === 'DRAFT' && (
                      <div className="mt-4 flex gap-2">
                        <form
                          action={decideDraftAction.bind(
                            null,
                            draft.id,
                            'approve',
                          )}
                        >
                          <Button type="submit">Approuver</Button>
                        </form>
                        <form
                          action={decideDraftAction.bind(
                            null,
                            draft.id,
                            'reject',
                          )}
                        >
                          <Button type="submit" variant="outline">
                            Rejeter
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
