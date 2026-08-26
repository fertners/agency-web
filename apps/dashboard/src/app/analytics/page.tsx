import { Card, CardContent } from '@/components/ui/card';
import { getAnalytics } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const period = (await searchParams).period ?? '30d';
  const data = await getAnalytics(period).catch(() => null);
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">MESURE</p>
        <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-slate-500">
          Performance commerciale, IA, websites et agents.
        </p>
      </header>
      {!data ? (
        <Card>
          <CardContent className="py-10 text-center">
            API indisponible.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(data.kpis).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-5">
                  <p className="text-sm text-slate-500">{value.label}</p>
                  <p className="text-3xl font-bold">{value.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>
          <section className="mt-6 grid gap-5 xl:grid-cols-2">
            <Card>
              <CardContent className="pt-5">
                <h2 className="mb-4 font-semibold">IA</h2>
                <p>Appels : {data.ai.calls}</p>
                <p>Tokens : {data.ai.inputTokens + data.ai.outputTokens}</p>
                <p>
                  Coût total : €
                  {(data.ai.totalCostMicros / 1_000_000).toFixed(4)}
                </p>
                <p>Durée moyenne : {data.ai.averageDurationMs} ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <h2 className="mb-4 font-semibold">Website Engine</h2>
                <p>Design moyen : {data.websites.averageDesignScore ?? '—'}</p>
                <p>SEO moyen : {data.websites.averageSeoScore ?? '—'}</p>
                <p>QA moyen : {data.websites.averageQaScore ?? '—'}</p>
                <p>Versions : {data.websites.versions}</p>
                <p>Approbation : {data.websites.approvalRate}%</p>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
