import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCompany } from '@/lib/api';

export const dynamic = 'force-dynamic';
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id).catch(() => null);
  if (!company) notFound();
  const relations = [
    ['Prospects', company.prospectIds.length],
    ['Websites', company.websiteIds.length],
    ['Propositions', company.proposalIds.length],
    ['Conversations', company.conversationIds.length],
    ['Projets', company.projectIds.length],
  ];
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/companies">
        ← Companies
      </a>
      <header className="my-6">
        <p className="text-sm font-semibold text-violet-600">COMPANY</p>
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <p className="mt-2 text-slate-500">
          {company.category} · {company.city}, {company.countryCode}
        </p>
      </header>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Informations générales</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <b>Adresse :</b> {company.address ?? '—'}
            </p>
            <p>
              <b>Téléphone :</b> {company.phone ?? '—'}
            </p>
            <p>
              <b>Email :</b> {company.email ?? '—'}
            </p>
            <p>
              <b>Website :</b> {company.websiteUrl ?? '—'}
            </p>
            <p>
              <b>Source :</b> {company.source}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Relations</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {relations.map(([label, count]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Client</p>
              <p className="font-bold">{company.clientId ? 'Oui' : 'Non'}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
