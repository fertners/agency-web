import { Card, CardContent } from '@/components/ui/card';
import { getOperationsJobs } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = (await searchParams).page ?? '1';
  const result = await getOperationsJobs(
    `page=${encodeURIComponent(page)}&limit=20`,
  ).catch(() => null);
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">SUPERVISION</p>
        <h1 className="mt-1 text-3xl font-bold">Agent Jobs</h1>
        <p className="mt-2 text-slate-500">
          Jobs, coûts, retries et corrélation des workflows.
        </p>
      </header>
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          {!result ? (
            <p className="py-10 text-center text-slate-500">
              API indisponible.
            </p>
          ) : (
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Job ID</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th>Entité</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Durée</th>
                  <th>Retries</th>
                  <th>Coût</th>
                  <th>Créé</th>
                </tr>
              </thead>
              <tbody>
                {result.jobs.map((job) => (
                  <tr className="border-b" key={job.id}>
                    <td className="py-4">
                      <a
                        className="font-mono text-xs text-violet-700"
                        href={`/jobs/${job.id}`}
                      >
                        {job.id.slice(0, 8)}…
                      </a>
                    </td>
                    <td>{job.agent}</td>
                    <td>{job.type}</td>
                    <td>{job.entityType ?? '—'}</td>
                    <td>{job.status}</td>
                    <td>{job.priority}</td>
                    <td>
                      {job.durationMs === null ? '—' : `${job.durationMs} ms`}
                    </td>
                    <td>
                      {job.retries}/{job.maxRetries}
                    </td>
                    <td>€{(job.costMicros / 1_000_000).toFixed(4)}</td>
                    <td>{new Date(job.createdAt).toLocaleString('fr-FR')}</td>
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
