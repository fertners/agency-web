import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getOperationsJob } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getOperationsJob(id).catch(() => null);
  if (!job) notFound();
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/jobs">
        ← Jobs
      </a>
      <h1 className="my-6 text-3xl font-bold">Job {job.id.slice(0, 8)}</h1>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Exécution</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <b>Agent :</b> {job.agent}
            </p>
            <p>
              <b>Type :</b> {job.type}
            </p>
            <p>
              <b>Statut :</b> {job.status}
            </p>
            <p>
              <b>Provider / modèle :</b> {job.provider ?? '—'} /{' '}
              {job.model ?? '—'}
            </p>
            <p>
              <b>Tokens :</b> {job.inputTokens} entrée · {job.outputTokens}{' '}
              sortie
            </p>
            <p>
              <b>Coût :</b> €{(job.costMicros / 1_000_000).toFixed(4)}
            </p>
            <p>
              <b>Erreur :</b> {job.error ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Logs structurés</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.logs.length ? (
              job.logs.map((log) => (
                <div
                  className="rounded-xl bg-slate-50 p-3 text-sm"
                  key={log.id}
                >
                  <b>{log.level}</b> ·{' '}
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                  <p>{log.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aucun log structuré.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
