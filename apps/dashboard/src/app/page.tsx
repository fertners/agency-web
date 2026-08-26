import type { AgentJobResponse, ServiceHealth } from '@ai-web-agency/shared';
import {
  Activity,
  Bot,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  FileCode2,
  FileText,
  Globe2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Rocket,
  Users,
} from 'lucide-react';

import { createDiagnosticAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getHealth, getJobs } from '@/lib/api';

export const dynamic = 'force-dynamic';

const navigation = [
  ['Dashboard', CircleGauge],
  ['Prospects', Search],
  ['Companies', Building2],
  ['Websites', Globe2],
  ['Proposals', FileText],
  ['Templates', FileCode2],
  ['Clients', Users],
  ['Deployments', Rocket],
  ['Conversations', MessageSquare],
  ['SEO', Activity],
  ['Agent Jobs', Bot],
  ['Analytics', ChartNoAxesCombined],
  ['Settings', Settings],
] as const;

function statusTone(status: string): string {
  if (status === 'UP' || status === 'COMPLETED')
    return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED' || status === 'DOWN')
    return 'bg-rose-50 text-rose-700';
  if (status === 'RUNNING') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

function ServiceRow({
  name,
  health,
}: {
  name: string;
  health: ServiceHealth | undefined;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${health?.status === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`}
        />
        <span className="font-medium text-slate-700">{name}</span>
      </div>
      <span className="text-sm text-slate-500">
        {health?.latencyMs === undefined
          ? 'Indisponible'
          : `${Math.round(health.latencyMs)} ms`}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const [healthResult, jobsResult] = await Promise.allSettled([
    getHealth(),
    getJobs(),
  ]);
  const health =
    healthResult.status === 'fulfilled' ? healthResult.value : undefined;
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value.jobs : [];
  const completed = jobs.filter((job) => job.status === 'COMPLETED').length;
  const failed = jobs.filter((job) => job.status === 'FAILED').length;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-slate-300 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white">
            <Bot size={21} />
          </div>
          <div>
            <p className="font-semibold text-white">AI Web Agency</p>
            <p className="text-xs text-slate-500">Operations console</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">
          {navigation.map(([label, Icon], index) => (
            <a
              key={label}
              href={
                label === 'Websites'
                  ? '/websites'
                  : label === 'Prospects'
                    ? '/prospects'
                    : label === 'Proposals'
                      ? '/proposals'
                      : label === 'Conversations'
                        ? '/conversations'
                        : label === 'Clients'
                          ? '/clients'
                          : label === 'Deployments'
                            ? '/deployments'
                            : '#'
              }
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${index === 0 ? 'bg-violet-500/15 text-violet-300' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={17} />
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 p-5 sm:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-semibold text-violet-600">
              PHASE 1 · FOUNDATION
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Vue d’ensemble
            </h1>
            <p className="mt-2 text-slate-500">
              Surveillez l’infrastructure et le pipeline de jobs.
            </p>
          </div>
          <form action={createDiagnosticAction}>
            <Button type="submit">
              <Plus className="mr-2" size={17} />
              Lancer un diagnostic
            </Button>
          </form>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-slate-500">
                État plateforme
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-bold">
                  {health?.status ?? 'Hors ligne'}
                </p>
                <Badge className={statusTone(health?.status ?? 'DOWN')}>
                  {health ? 'Connecté' : 'API inaccessible'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-slate-500">
                Jobs terminés
              </p>
              <p className="mt-3 text-3xl font-bold">{completed}</p>
              <p className="mt-1 text-xs text-slate-400">
                sur les 20 plus récents
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-slate-500">Échecs</p>
              <p className="mt-3 text-3xl font-bold">{failed}</p>
              <p className="mt-1 text-xs text-slate-400">
                nécessitent une vérification
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <h2 className="font-semibold text-slate-950">Jobs récents</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dernières opérations persistées
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-600">
                {jobs.length} jobs
              </Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto px-0 pb-0">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Job</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Tentative</th>
                    <th className="px-5 py-3">Créé</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        Aucun job pour le moment.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job: AgentJobResponse) => (
                      <tr
                        key={job.jobId}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {job.type}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {job.jobId.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={statusTone(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {job.attempt} / 3
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Intl.DateTimeFormat('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(job.createdAt))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <h2 className="font-semibold text-slate-950">Services</h2>
                <p className="mt-1 text-sm text-slate-500">
                  État en temps réel
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ServiceRow name="API NestJS" health={health?.services.api} />
              <ServiceRow
                name="PostgreSQL"
                health={health?.services.postgres}
              />
              <ServiceRow name="Redis" health={health?.services.redis} />
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                <p className="font-medium text-slate-700">
                  Dernière vérification
                </p>
                <p className="mt-1">
                  {health
                    ? new Intl.DateTimeFormat('fr-FR', {
                        timeStyle: 'medium',
                      }).format(new Date(health.timestamp))
                    : 'Connexion impossible'}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
