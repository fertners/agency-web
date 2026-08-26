import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getProposals } from '@/lib/api';
import { decideProposalAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const { proposals } = await getProposals().catch(() => ({ proposals: [] }));
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/prospects" className="text-sm text-violet-700">
            ← Prospects
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-600">
            Phase 6 · Commercial
          </p>
          <h1 className="text-3xl font-semibold">Propositions</h1>
          <p className="text-slate-500">
            Validation humaine obligatoire avant toute communication.
          </p>
        </div>
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Aucune proposition.
            </CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{proposal.title}</h2>
                    <p className="text-sm text-slate-500">
                      Version {proposal.version}
                    </p>
                  </div>
                  <Badge>{proposal.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{proposal.summary}</p>
                <ul className="my-4 list-disc pl-5 text-sm">
                  {proposal.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="font-semibold">
                  {(proposal.priceCents / 100).toLocaleString('fr-FR')}{' '}
                  {proposal.currency} · {proposal.timelineDays} jours
                </p>
                {proposal.status === 'NEEDS_REVIEW' && (
                  <div className="mt-4 flex gap-2">
                    <form
                      action={decideProposalAction.bind(
                        null,
                        proposal.id,
                        'approve',
                      )}
                    >
                      <Button type="submit">Approuver</Button>
                    </form>
                    <form
                      action={decideProposalAction.bind(
                        null,
                        proposal.id,
                        'reject',
                      )}
                    >
                      <Button type="submit" variant="outline">
                        Rejeter
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
