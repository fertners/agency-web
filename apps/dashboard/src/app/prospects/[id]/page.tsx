import { PROSPECT_TRANSITIONS } from '@ai-web-agency/shared';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getProspect } from '@/lib/api';
import {
  addNoteAction,
  createDraftAction,
  createProposalAction,
  convertProspectAction,
  updateStatusAction,
  generateWebsiteAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProspect(id).catch(() => null);
  if (!result) notFound();
  const { prospect, history, notes, proposals } = result;
  const availableStatuses = [
    prospect.status,
    ...PROSPECT_TRANSITIONS[prospect.status],
  ];
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/prospects" className="text-sm text-violet-700">
            ← Prospects
          </a>
          <h1 className="mt-2 text-3xl font-semibold">{prospect.name}</h1>
          <p className="text-slate-500">
            {prospect.city}, {prospect.countryCode} · {prospect.source}
          </p>
        </div>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Website Preview</h2>
            <p className="text-sm text-slate-500">
              Crée une version depuis les données Research vérifiées. Les assets
              en attente de licence restent exclus.
            </p>
          </CardHeader>
          <CardContent>
            <form action={generateWebsiteAction.bind(null, id)}>
              <Button type="submit">Generate Website</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Identité</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <b>Catégorie :</b> {prospect.category}
              </p>
              <p>
                <b>Adresse :</b> {prospect.address ?? '—'}
              </p>
              <p>
                <b>Téléphone :</b> {prospect.phone ?? '—'}
              </p>
              <p>
                <b>Email professionnel :</b> {prospect.email ?? '—'}
              </p>
              <p>
                <b>Website :</b> {prospect.websiteUrl ?? 'Absent'}
              </p>
              <p>
                <b>Prochaine action :</b> {prospect.nextAction ?? '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Opportunity</h2>
              <Badge>{prospect.opportunityScore ?? '—'} / 100</Badge>
            </CardHeader>
            <CardContent>
              {prospect.assessment ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Website quality :{' '}
                    {prospect.assessment.components.websiteQuality}/100
                  </p>
                  <p>Mobile : {prospect.assessment.components.mobile}/100</p>
                  <p>SEO : {prospect.assessment.components.seo}/100</p>
                  <p>
                    Missing features :{' '}
                    {prospect.assessment.components.missingFeatures}/100
                  </p>
                  <p className="pt-2 text-slate-600">
                    {prospect.assessment.summary}
                  </p>
                  <ul className="list-disc pl-5 text-slate-500">
                    {prospect.assessment.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Aucune analyse persistée.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Qualification</h2>
            </CardHeader>
            <CardContent>
              <form
                action={updateStatusAction.bind(null, id)}
                className="space-y-3"
              >
                <select
                  name="status"
                  defaultValue={prospect.status}
                  className="w-full rounded-lg border p-2"
                >
                  {availableStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <textarea
                  name="note"
                  placeholder="Motif du changement (optionnel)"
                  className="min-h-20 w-full rounded-lg border p-2"
                />
                <Button type="submit">Enregistrer le statut</Button>
              </form>
              <div className="mt-5 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-slate-100 p-3 text-sm"
                  >
                    <Badge>{item.toStatus}</Badge>
                    <span className="ml-2 text-slate-500">
                      {new Date(item.createdAt).toLocaleString('fr-FR')}
                    </span>
                    {item.note && <p className="mt-1">{item.note}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Notes internes</h2>
            </CardHeader>
            <CardContent>
              <form action={addNoteAction.bind(null, id)} className="space-y-3">
                <textarea
                  required
                  name="content"
                  className="min-h-24 w-full rounded-lg border p-2"
                  placeholder="Ajouter une note privée"
                />
                <Button type="submit">Ajouter</Button>
              </form>
              <div className="mt-5 space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-3 text-sm">
                    <p>{note.content}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(note.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Nouvelle proposition</h2>
            <p className="text-sm text-slate-500">
              Document structuré, sans envoi automatique.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={createProposalAction.bind(null, id)}
              className="grid gap-3 sm:grid-cols-3"
            >
              <input
                required
                name="priceEuros"
                type="number"
                min="0"
                placeholder="Prix €"
                className="rounded-lg border p-2"
              />
              <input
                required
                name="timelineDays"
                type="number"
                min="1"
                defaultValue="21"
                className="rounded-lg border p-2"
              />
              <textarea
                required
                name="scope"
                defaultValue={
                  'Site restaurant responsive\nSEO local\nFormulaire de contact'
                }
                className="min-h-24 rounded-lg border p-2 sm:col-span-3"
              />
              <Button type="submit">Créer la proposition</Button>
            </form>
            <div className="mt-5 space-y-2">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="rounded-lg border p-4">
                  <div className="flex justify-between">
                    <strong>
                      V{proposal.version} · {proposal.title}
                    </strong>
                    <Badge>{proposal.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {proposal.summary}
                  </p>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium">
                      Voir le message commercial
                    </summary>
                    <p className="mt-2 whitespace-pre-line text-slate-600">
                      {proposal.message}
                    </p>
                  </details>
                  <p className="mt-2 font-medium">
                    {(proposal.priceCents / 100).toLocaleString('fr-FR')}{' '}
                    {proposal.currency} · {proposal.timelineDays} jours
                  </p>
                  {proposal.status === 'APPROVED' &&
                    !['CONVERTED', 'WON'].includes(prospect.status) && (
                      <form
                        className="mt-3"
                        action={convertProspectAction.bind(
                          null,
                          id,
                          proposal.id,
                        )}
                      >
                        <Button type="submit">Convertir en client</Button>
                      </form>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Premier contact</h2>
          </CardHeader>
          <CardContent>
            <form action={createDraftAction.bind(null, id)}>
              <Button type="submit">Générer un brouillon e-mail</Button>
              <p className="mt-2 text-sm text-amber-700">
                Le brouillon ne sera pas envoyé.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
