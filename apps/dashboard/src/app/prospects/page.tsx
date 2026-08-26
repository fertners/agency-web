import {
  Bot,
  Search,
  Globe2,
  ArrowLeft,
  MapPin,
  ExternalLink,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getProspects } from '@/lib/api';
import { searchProspectsAction } from './actions';
export const dynamic = 'force-dynamic';
function tone(score: number | null): string {
  if (score === null) return 'bg-slate-100 text-slate-600';
  if (score >= 70) return 'bg-emerald-50 text-emerald-700';
  if (score >= 45) return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}
export default async function ProspectsPage() {
  const result = await getProspects().catch(() => ({ prospects: [] }));
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-slate-950 px-5 py-6 text-slate-300">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white">
            <Bot size={20} />
          </div>
          <div>
            <p className="font-semibold text-white">AI Web Agency</p>
            <p className="text-xs text-slate-500">Opportunity engine</p>
          </div>
        </div>
        <a
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft size={16} />
          Dashboard
        </a>
        <a
          href="/prospects"
          className="mt-2 flex items-center gap-2 rounded-xl bg-violet-500/15 px-3 py-2 text-sm text-violet-300"
        >
          <Search size={16} />
          Prospects
        </a>
        <a
          href="/websites"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
        >
          <Globe2 size={16} />
          Websites
        </a>
        <a
          href="/proposals"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
        >
          <FileText size={16} />
          Propositions
        </a>
        <a
          href="/conversations"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
        >
          <MessageSquare size={16} />
          Conversations
        </a>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">
        <header className="mb-7">
          <p className="text-sm font-semibold text-violet-600">
            PHASE 5 · PROSPECT RESEARCH
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Opportunités locales
          </h1>
          <p className="mt-2 text-slate-500">
            Recherchez des restaurants, dédupliquez-les et classez le besoin
            numérique.
          </p>
        </header>
        <Card className="mb-6">
          <CardHeader>
            <div>
              <h2 className="font-semibold">Nouvelle recherche</h2>
              <p className="mt-1 text-sm text-slate-500">
                Le traitement est asynchrone et n’envoie aucun message.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form
              action={searchProspectsAction}
              className="grid gap-3 sm:grid-cols-[1fr_110px_110px_auto]"
            >
              <input
                name="city"
                required
                minLength={2}
                placeholder="Ville (ex. Lyon)"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-violet-400"
              />
              <input
                name="countryCode"
                defaultValue="FR"
                maxLength={2}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 uppercase"
              />
              <input
                name="limit"
                type="number"
                min="1"
                max="50"
                defaultValue="5"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5"
              />
              <Button type="submit">
                <Search className="mr-2" size={16} />
                Rechercher
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-semibold">Prospects classés</h2>
              <p className="mt-1 text-sm text-slate-500">
                Score élevé = opportunité prioritaire.
              </p>
            </div>
            <Badge className="bg-slate-100 text-slate-600">
              {result.prospects.length} entreprises
            </Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Diagnostic</th>
                  <th className="px-5 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {result.prospects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Lancez une recherche, puis actualisez après le passage du
                      worker.
                    </td>
                  </tr>
                ) : (
                  result.prospects.map((item) => (
                    <tr
                      key={item.prospectId}
                      className="border-b border-slate-100"
                    >
                      <td className="px-5 py-4">
                        <a
                          className="font-medium text-violet-700 hover:underline"
                          href={`/prospects/${item.prospectId}`}
                        >
                          {item.name}
                        </a>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={12} />
                          {item.city}, {item.countryCode}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Source : {item.source}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {item.email ?? item.phone ?? 'À enrichir'}
                        {item.websiteUrl && (
                          <a
                            className="ml-2 inline-flex text-violet-600"
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                      <td className="max-w-sm px-5 py-4 text-slate-500">
                        {item.assessment?.summary ?? 'Analyse en attente'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={tone(item.opportunityScore)}>
                          {item.opportunityScore ?? '—'} / 100
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <p className="mt-4 text-xs text-slate-400">
          Données © OpenStreetMap contributors, disponibles sous licence ODbL.
        </p>
      </main>
    </div>
  );
}
