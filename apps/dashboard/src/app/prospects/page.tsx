import { Card, CardContent } from '@/components/ui/card';
import { getProspectDirectory } from '@/lib/api';
import { ProspectBatchTable } from './prospect-batch-table';

export const dynamic = 'force-dynamic';
export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of [
    'page',
    'search',
    'category',
    'countryCode',
    'city',
    'minScore',
    'maxScore',
    'status',
    'websiteQuality',
    'from',
    'to',
    'sort',
  ])
    if (params[key]) query.set(key, params[key]);
  query.set('limit', '20');
  const result = await getProspectDirectory(query.toString()).catch(() => null);
  const pageHref = (page: number) => {
    const copy = new URLSearchParams(query);
    copy.set('page', String(page));
    return `?${copy}`;
  };
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">
          OPPORTUNITÉS COMMERCIALES
        </p>
        <h1 className="mt-1 text-3xl font-bold">Prospects</h1>
        <p className="mt-2 text-slate-500">
          Une relation commerciale liée à une Company, avec pagination backend.
        </p>
      </header>
      <Card className="mb-5">
        <CardContent className="pt-5">
          <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.search}
              name="search"
              placeholder="Recherche"
            />
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.category}
              name="category"
              placeholder="Catégorie"
            />
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.city}
              name="city"
              placeholder="Ville"
            />
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.countryCode}
              maxLength={2}
              name="countryCode"
              placeholder="Pays (FR)"
            />
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.minScore}
              min="0"
              max="100"
              name="minScore"
              placeholder="Score min"
              type="number"
            />
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.maxScore}
              min="0"
              max="100"
              name="maxScore"
              placeholder="Score max"
              type="number"
            />
            <select
              className="rounded-xl border px-3 py-2"
              defaultValue={params.websiteQuality ?? ''}
              name="websiteQuality"
            >
              <option value="">Toute qualité</option>
              <option value="absent">Site absent</option>
              <option value="weak">Faible</option>
              <option value="medium">Moyen</option>
              <option value="good">Bon</option>
            </select>
            <select
              className="rounded-xl border px-3 py-2"
              defaultValue={params.sort ?? 'score_desc'}
              name="sort"
            >
              <option value="score_desc">Score décroissant</option>
              <option value="score_asc">Score croissant</option>
              <option value="recent">Date récente</option>
              <option value="oldest">Date ancienne</option>
              <option value="name">Nom</option>
              <option value="category">Catégorie</option>
            </select>
            <div className="flex gap-2">
              <button className="rounded-xl bg-slate-950 px-4 py-2 text-white">
                Filtrer
              </button>
              <a className="rounded-xl border px-4 py-2" href="/prospects">
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          {!result ? (
            <p className="py-10 text-center text-slate-500">
              API indisponible.
            </p>
          ) : (
            <>
              <ProspectBatchTable prospects={result.prospects} />
              <div className="mt-5 flex justify-between text-sm">
                <span>{result.pagination.total} prospect(s)</span>
                <div className="flex gap-4">
                  {result.pagination.previous && (
                    <a href={pageHref(result.pagination.previous)}>
                      ← Précédent
                    </a>
                  )}
                  {result.pagination.next && (
                    <a href={pageHref(result.pagination.next)}>Suivant →</a>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
