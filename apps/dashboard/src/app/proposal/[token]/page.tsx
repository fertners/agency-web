import { notFound } from 'next/navigation';
import Image from 'next/image';
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
        <CardHeader className="flex-col">
          <p className="text-sm font-semibold text-violet-700">AI Web Agency</p>
          <h1 className="text-3xl font-semibold">{proposal.title}</h1>
          <p className="text-slate-500">Préparée pour {proposal.companyName}</p>
        </CardHeader>
        <CardContent className="space-y-7">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
            {proposal.message}
          </p>
          <a
            href="#response"
            className="inline-flex rounded-lg bg-slate-900 px-5 py-3 font-medium text-white"
          >
            Répondre à cette proposition
          </a>
          <div>
            <h2 className="font-semibold">Points relevés</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {proposal.analysisIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl border bg-slate-50">
            {proposal.previewImageUrl === null ? (
              <p className="p-6 text-sm text-slate-500">
                Capture indisponible pour cette ancienne proposition.
              </p>
            ) : (
              <Image
                src={proposal.previewImageUrl}
                alt={`Capture de la proposition de site pour ${proposal.companyName}`}
                width={1440}
                height={900}
                unoptimized
                className="h-auto w-full"
              />
            )}
            <div className="border-t p-4">
              <a
                href={proposal.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-violet-700 underline"
              >
                Ouvrir la prévisualisation interactive
              </a>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-medium text-violet-700">
              {proposal.websiteType === 'SHOWCASE'
                ? 'Site vitrine'
                : 'Site dynamique'}
            </p>
            <p className="text-2xl font-semibold">
              {(proposal.priceCents / 100).toLocaleString('fr-FR')}{' '}
              {proposal.currency}
            </p>
            <p className="text-sm text-slate-500">
              Délai estimé : {proposal.timelineDays} jours
            </p>
          </div>
          {proposal.response === null ? (
            <div
              id="response"
              className="flex scroll-mt-8 flex-wrap gap-3 border-t pt-6"
            >
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
