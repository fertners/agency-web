import { AlertTriangle, Bot, BriefcaseBusiness } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getDashboardOverview } from '@/lib/api';

export const dynamic = 'force-dynamic';
const periods = [
  ['today', 'Aujourd’hui'],
  ['7d', '7 jours'],
  ['30d', '30 jours'],
  ['90d', '90 jours'],
] as const;
const tone = (status: string) =>
  status === 'RUNNING'
    ? 'bg-blue-50 text-blue-700'
    : status === 'DEGRADED' || status === 'FAILED'
      ? 'bg-rose-50 text-rose-700'
      : 'bg-emerald-50 text-emerald-700';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const requested = (await searchParams).period ?? '30d';
  const period = periods.some(([value]) => value === requested)
    ? requested
    : '30d';
  const overview = await getDashboardOverview(period).catch(() => null);
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-600">PILOTAGE</p>
          <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            Funnel, agents et alertes issus de l’API.
          </p>
        </div>
        <nav className="flex rounded-xl border bg-white p-1 text-sm">
          {periods.map(([value, label]) => (
            <a
              className={`rounded-lg px-3 py-2 ${period === value ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
              href={`/?period=${value}`}
              key={value}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      {!overview ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            API ou base indisponible. Aucun chiffre fictif n’est affiché.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(overview.kpis).map(([key, metric]) => (
              <Card key={key}>
                <CardContent className="pt-5">
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>
          <section className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <div>
                  <h2 className="font-semibold">Funnel commercial</h2>
                  <p className="text-sm text-slate-500">Conversion par étape</p>
                </div>
                <BriefcaseBusiness className="text-violet-500" size={20} />
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.funnel.map((step) => (
                  <div
                    className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl bg-slate-50 px-4 py-3"
                    key={step.key}
                  >
                    <span>{step.label}</span>
                    <strong>{step.count}</strong>
                    <span className="w-16 text-right text-sm text-slate-500">
                      {step.conversion === null ? '—' : `${step.conversion}%`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <h2 className="font-semibold">Agents</h2>
                  <p className="text-sm text-slate-500">État opérationnel</p>
                </div>
                <Bot className="text-violet-500" size={20} />
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.agents.map((agent) => (
                  <div
                    className="flex items-center justify-between border-b pb-3"
                    key={agent.agent}
                  >
                    <div>
                      <p className="font-medium">{agent.agent}</p>
                      <p className="text-xs text-slate-500">
                        {agent.pending} attente · {agent.running} actif
                      </p>
                    </div>
                    <Badge className={tone(agent.status)}>{agent.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Jobs récents</h2>
                <a
                  className="text-sm font-semibold text-violet-600"
                  href="/jobs"
                >
                  Tout voir →
                </a>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b text-slate-500">
                    <tr>
                      <th className="pb-3">Agent</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Statut</th>
                      <th className="pb-3">Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentJobs.map((job) => (
                      <tr className="border-b" key={job.id}>
                        <td className="py-3">{job.agent}</td>
                        <td>{job.type}</td>
                        <td>{job.status}</td>
                        <td>€{(job.costMicros / 1_000_000).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Alertes</h2>
                <AlertTriangle className="text-amber-500" size={20} />
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.alerts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune alerte active.
                  </p>
                ) : (
                  overview.alerts.map((alert) => (
                    <a
                      className="block rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
                      href={alert.href}
                      key={`${alert.href}-${alert.message}`}
                    >
                      {alert.message}
                    </a>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
