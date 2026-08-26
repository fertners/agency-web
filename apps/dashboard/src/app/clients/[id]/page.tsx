import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getClient } from '@/lib/api';

export const dynamic = 'force-dynamic';
export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClient(id).catch(() => null);
  if (!data) notFound();
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/clients">
        ← Clients
      </a>
      <header className="my-6">
        <p className="text-sm font-semibold text-violet-600">
          CLIENT · {data.client.status}
        </p>
        <h1 className="text-3xl font-bold">{data.client.name}</h1>
        <p className="mt-2 text-slate-500">
          Company {data.client.companyId ?? 'non liée'}
        </p>
      </header>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Projects & Websites</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.projects.length ? (
              data.projects.map((project) => (
                <div className="rounded-xl bg-slate-50 p-4" key={project.id}>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm">{project.status}</p>
                  {project.websiteId && (
                    <a
                      className="text-sm font-semibold text-violet-700"
                      href={`/websites/${project.websiteId}`}
                    >
                      Voir le Website →
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aucun projet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Payments</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.payments.length ? (
              data.payments.map((payment) => (
                <div className="rounded-xl bg-slate-50 p-4" key={payment.id}>
                  <b>{payment.status}</b> ·{' '}
                  {(payment.amountCents / 100).toFixed(2)} {payment.currency}
                  <p className="text-xs text-slate-500">{payment.provider}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Aucun paiement référencé. Aucune donnée bancaire sensible n’est
                stockée.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Requests</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.requests.length ? (
              data.requests.map((request) => (
                <div className="rounded-xl bg-slate-50 p-4" key={request.id}>
                  <b>{request.status}</b>
                  <p>{request.request}</p>
                  <p className="text-xs text-slate-500">
                    Toute modification crée une nouvelle version avant QA.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aucune demande ouverte.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Conversations</h2>
          </CardHeader>
          <CardContent>
            {data.conversationIds.length ? (
              data.conversationIds.map((conversationId) => (
                <a
                  className="block text-sm font-semibold text-violet-700"
                  href={`/conversations/${conversationId}`}
                  key={conversationId}
                >
                  {conversationId}
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Aucune conversation liée.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
