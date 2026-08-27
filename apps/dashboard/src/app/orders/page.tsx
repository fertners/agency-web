import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getProposals, getProspect } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const { proposals } = await getProposals().catch(() => ({ proposals: [] }));
  const accepted = proposals.filter(({ response }) => response === 'ACCEPTED');
  const orders = await Promise.all(
    accepted.map(async (proposal) => ({
      proposal,
      prospect: await getProspect(proposal.prospectId)
        .then(({ prospect }) => prospect)
        .catch(() => null),
    })),
  );
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">
          OFFRES ACCEPTÉES
        </p>
        <h1 className="mt-1 text-3xl font-bold">Commandes</h1>
        <p className="mt-2 text-slate-500">
          Les prospects ayant accepté leur proposition depuis l’e-mail
          apparaissent ici automatiquement.
        </p>
      </header>
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          {orders.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              Aucune commande pour le moment.
            </p>
          ) : (
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Entreprise</th>
                  <th>Ville</th>
                  <th>Offre</th>
                  <th>Montant</th>
                  <th>Acceptée le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(({ proposal, prospect }) => (
                  <tr className="border-b" key={proposal.id}>
                    <td className="py-4">
                      <a
                        className="font-semibold text-violet-700"
                        href={`/prospects/${proposal.prospectId}`}
                      >
                        {prospect?.name ?? proposal.title}
                      </a>
                    </td>
                    <td>{prospect?.city ?? '—'}</td>
                    <td>
                      {proposal.websiteType === 'SHOWCASE'
                        ? 'Site vitrine'
                        : 'Site dynamique'}
                    </td>
                    <td>
                      {(proposal.priceCents / 100).toLocaleString('fr-FR')}{' '}
                      {proposal.currency}
                    </td>
                    <td>
                      {proposal.respondedAt
                        ? new Date(proposal.respondedAt).toLocaleDateString(
                            'fr-FR',
                          )
                        : '—'}
                    </td>
                    <td>
                      <Badge>ACCEPTÉE</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
