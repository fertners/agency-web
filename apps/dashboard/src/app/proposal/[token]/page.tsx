import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPublicProposal } from '@/lib/api';
import { respondAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await getPublicProposal(token).catch(() => null);
  if (proposal === null) notFound();
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <p className="text-sm font-semibold text-violet-700">AI Web Agency</p>
          <h1 className="text-3xl font-semibold">{proposal.title}</h1>
          <p className="text-slate-500">Préparée pour {proposal.companyName}</p>
        </CardHeader>
        <CardContent className="space-y-7">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
            {proposal.message}
          </p>
          <div>
            <h2 className="font-semibold">Points relevés</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {proposal.analysisIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
          <a
            href={proposal.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-violet-700 px-5 py-3 font-medium text-white"
          >
            Prévisualiser le site
          </a>
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-2xl font-semibold">
              {(proposal.priceCents / 100).toLocaleString('fr-FR')}{' '}
              {proposal.currency}
            </p>
            <p className="text-sm text-slate-500">
              Délai estimé : {proposal.timelineDays} jours
            </p>
          </div>
          {proposal.response === null ? (
            <div className="flex flex-wrap gap-3 border-t pt-6">
              <form action={respondAction.bind(null, token, 'accept')}>
                <Button type="submit">Oui, j’accepte</Button>
              </form>
              <form action={respondAction.bind(null, token, 'decline')}>
                <Button type="submit" variant="outline">
                  Non, ne plus m’envoyer de message
                </Button>
              </form>
            </div>
          ) : (
            <p>Votre réponse a déjà été enregistrée.</p>
          )}
          <p className="text-xs text-slate-400">
            Proposition valable jusqu’au{' '}
            {proposal.expiresAt === null
              ? '—'
              : new Date(proposal.expiresAt).toLocaleDateString('fr-FR')}
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
