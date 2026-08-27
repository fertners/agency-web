'use client';

import type { AgentJobResponse } from '@ai-web-agency/shared';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useToast } from '@/components/toast-provider';
import {
  getProposalWorkflowJobsAction,
  launchProposalWorkflowsAction,
} from './actions';

type ProspectRow = Readonly<{
  id: string;
  companyName: string;
  category: string;
  city: string;
  countryCode: string;
  opportunityScore: number | null;
  websiteQuality: number | null;
  hasWebsite: boolean;
  status: string;
  lastAnalyzedAt: string | null;
  discoveredAt: string;
  nextAction: string | null;
}>;

const pipeline = [
  { key: 'qualification', label: 'Qualification' },
  { key: 'generation', label: 'Génération du site' },
  { key: 'designReview', label: 'Design Review' },
  { key: 'quality', label: 'SEO / QA' },
  { key: 'proposal', label: 'Création proposition' },
  { key: 'publication', label: 'Publication du lien' },
] as const;

type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
type RunningJob = Readonly<{ prospectId: string; jobId: string }>;

function readStepStatus(
  job: AgentJobResponse,
  step: (typeof pipeline)[number]['key'],
): StepStatus {
  if (job.status === 'PENDING')
    return step === 'qualification' ? 'RUNNING' : 'PENDING';
  const progress = job.output?.workflowProgress;
  if (
    typeof progress === 'object' &&
    progress !== null &&
    'steps' in progress
  ) {
    const steps = progress.steps;
    if (typeof steps === 'object' && steps !== null && step in steps) {
      const value = (steps as Record<string, unknown>)[step];
      if (
        value === 'PENDING' ||
        value === 'RUNNING' ||
        value === 'COMPLETED' ||
        value === 'FAILED'
      )
        return value;
    }
  }
  if (job.status === 'COMPLETED') return 'COMPLETED';
  if (job.status === 'FAILED')
    return step === 'qualification' ? 'FAILED' : 'PENDING';
  return 'PENDING';
}

function StepIcon({ status }: Readonly<{ status: StepStatus }>) {
  if (status === 'RUNNING')
    return (
      <span
        aria-label="En cours"
        className="inline-block size-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
      />
    );
  if (status === 'COMPLETED')
    return <span className="text-lg font-bold text-emerald-600">✓</span>;
  if (status === 'FAILED')
    return <span className="text-lg font-bold text-red-600">✕</span>;
  return <span className="inline-block size-3 rounded-full bg-slate-300" />;
}

export function ProspectBatchTable({
  prospects,
}: Readonly<{ prospects: ProspectRow[] }>) {
  const [selected, setSelected] = useState<string[]>([]);
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [jobStates, setJobStates] = useState<Record<string, AgentJobResponse>>(
    {},
  );
  const [isPending, startTransition] = useTransition();
  const { notify } = useToast();
  const allSelected =
    prospects.length > 0 && selected.length === prospects.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  useEffect(() => {
    if (runningJobs.length === 0) return;
    let active = true;
    async function refresh() {
      try {
        const jobs = await getProposalWorkflowJobsAction(
          runningJobs.map(({ jobId }) => jobId),
        );
        if (!active) return;
        setJobStates(Object.fromEntries(jobs.map((job) => [job.jobId, job])));
      } catch {
        if (active)
          notify(
            "Impossible d'actualiser l'avancement de la pipeline.",
            'error',
          );
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [runningJobs, notify]);

  function launch() {
    startTransition(async () => {
      try {
        const result = await launchProposalWorkflowsAction(selected);
        notify(result.message, result.ok ? 'success' : 'error');
        if ('jobs' in result) setRunningJobs(result.jobs);
      } catch {
        notify('Le lancement des propositions a échoué.', 'error');
      }
    });
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
          onClick={() =>
            setSelected(allSelected ? [] : prospects.map(({ id }) => id))
          }
          type="button"
        >
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <button
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={selected.length === 0 || isPending}
          onClick={launch}
          type="button"
        >
          {isPending
            ? 'Lancement…'
            : `Lancer les propositions (${selected.length})`}
        </button>
      </div>
      {runningJobs.length > 0 && (
        <div className="mb-5 space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div>
            <p className="font-semibold text-violet-900">
              Suivi des propositions
            </p>
            <p className="text-sm text-violet-700">
              Mise à jour automatique toutes les 2 secondes.
            </p>
          </div>
          {runningJobs.map(({ prospectId, jobId }) => {
            const prospect = prospects.find(({ id }) => id === prospectId);
            const job = jobStates[jobId];
            return (
              <div className="rounded-xl bg-white p-4 shadow-sm" key={jobId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a
                    className="font-semibold text-violet-700"
                    href={`/prospects/${prospectId}`}
                  >
                    {prospect?.companyName ?? prospectId}
                  </a>
                  <span className="text-xs font-medium text-slate-500">
                    {job?.status === 'COMPLETED'
                      ? 'Pipeline terminée'
                      : job?.status === 'FAILED'
                        ? 'Pipeline échouée'
                        : job?.status === 'RUNNING'
                          ? 'Traitement en cours'
                          : 'En attente de démarrage'}
                  </span>
                </div>
                <ol className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                  {pipeline.map((step) => {
                    const status = job
                      ? readStepStatus(job, step.key)
                      : step.key === 'qualification'
                        ? 'RUNNING'
                        : 'PENDING';
                    return (
                      <li
                        className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 ${
                          status === 'FAILED'
                            ? 'border-red-200 bg-red-50'
                            : status === 'COMPLETED'
                              ? 'border-emerald-200 bg-emerald-50'
                              : status === 'RUNNING'
                                ? 'border-violet-300 bg-violet-50'
                                : 'border-slate-200 bg-slate-50'
                        }`}
                        key={step.key}
                      >
                        <StepIcon status={status} />
                        <div>
                          <p className="text-xs font-semibold">{step.label}</p>
                          <p className="text-[11px] text-slate-500">
                            {status === 'COMPLETED'
                              ? 'Validé'
                              : status === 'RUNNING'
                                ? 'En cours…'
                                : status === 'FAILED'
                                  ? 'Échec'
                                  : 'En attente'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {job?.status === 'FAILED' && job.error && (
                  <p className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                    <b>Cause de l’échec :</b> {job.error}
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-xs text-amber-800">
            La publication crée le lien public de la proposition. L’envoi réel
            par e-mail restera indisponible tant qu’un fournisseur d’e-mail
            n’est pas configuré.
          </p>
        </div>
      )}
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="pb-3">
              <span className="sr-only">Sélection</span>
            </th>
            <th>Entreprise</th>
            <th>Catégorie</th>
            <th>Ville</th>
            <th>Pays</th>
            <th>Score</th>
            <th>Qualité site</th>
            <th>Site</th>
            <th>Statut</th>
            <th>Dernière analyse</th>
            <th>Découverte</th>
            <th>Prochaine action</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect) => (
            <tr className="border-b" key={prospect.id}>
              <td className="py-4">
                <input
                  aria-label={`Sélectionner ${prospect.companyName}`}
                  checked={selectedSet.has(prospect.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, prospect.id]
                        : current.filter((id) => id !== prospect.id),
                    )
                  }
                  type="checkbox"
                />
              </td>
              <td>
                <a
                  className="font-semibold text-violet-700"
                  href={`/prospects/${prospect.id}`}
                >
                  {prospect.companyName}
                </a>
              </td>
              <td>{prospect.category}</td>
              <td>{prospect.city}</td>
              <td>{prospect.countryCode}</td>
              <td>{prospect.opportunityScore ?? '—'}</td>
              <td>{prospect.websiteQuality ?? '—'}</td>
              <td>{prospect.hasWebsite ? 'Oui' : 'Non'}</td>
              <td>{prospect.status}</td>
              <td>
                {prospect.lastAnalyzedAt
                  ? new Date(prospect.lastAnalyzedAt).toLocaleDateString(
                      'fr-FR',
                    )
                  : '—'}
              </td>
              <td>
                {new Date(prospect.discoveredAt).toLocaleDateString('fr-FR')}
              </td>
              <td>{prospect.nextAction ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
