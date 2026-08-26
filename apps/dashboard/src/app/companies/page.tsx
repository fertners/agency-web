import { Card, CardContent } from '@/components/ui/card';
import { getCompanies } from '@/lib/api';

export const dynamic = 'force-dynamic';
export default async function CompaniesPage({
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
    'sort',
  ]) {
    if (params[key]) query.set(key, params[key]);
  }
  query.set('limit', '20');
  const result = await getCompanies(query.toString()).catch(() => null);
  const pageHref = (page: number) => {
    const copy = new URLSearchParams(query);
    copy.set('page', String(page));
    return `?${copy}`;
  };
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">
          RÉFÉRENTIEL CENTRAL
        </p>
        <h1 className="mt-1 text-3xl font-bold">Companies</h1>
        <p className="mt-2 text-slate-500">
          Entreprises dédupliquées, distinctes de leur opportunité commerciale.
        </p>
      </header>
      <Card className="mb-5">
        <CardContent className="pt-5">
          <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <input
              className="rounded-xl border px-3 py-2"
              defaultValue={params.search}
              name="search"
              placeholder="Rechercher"
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
            <select
              className="rounded-xl border px-3 py-2"
              defaultValue={params.sort ?? 'recent'}
              name="sort"
            >
              <option value="recent">Récentes</option>
              <option value="oldest">Anciennes</option>
              <option value="name">Nom</option>
              <option value="category">Catégorie</option>
            </select>
            <div className="flex gap-2">
              <button className="rounded-xl bg-slate-950 px-4 py-2 text-white">
                Filtrer
              </button>
              <a className="rounded-xl border px-4 py-2" href="/companies">
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
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="pb-3">Nom</th>
                    <th>Catégorie</th>
                    <th>Ville</th>
                    <th>Pays</th>
                    <th>Website</th>
                    <th>Client</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.companies.map((company) => (
                    <tr className="border-b" key={company.id}>
                      <td className="py-4">
                        <a
                          className="font-semibold text-violet-700"
                          href={`/companies/${company.id}`}
                        >
                          {company.name}
                        </a>
                      </td>
                      <td>{company.category}</td>
                      <td>{company.city}</td>
                      <td>{company.countryCode}</td>
                      <td>
                        {company.websiteUrl ? (
                          <a
                            className="text-violet-600"
                            href={company.websiteUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Ouvrir
                          </a>
                        ) : (
                          'Absent'
                        )}
                      </td>
                      <td>{company.isClient ? 'Oui' : 'Non'}</td>
                      <td>
                        {new Date(company.createdAt).toLocaleDateString(
                          'fr-FR',
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-5 flex justify-between text-sm">
                <span>{result.pagination.total} entreprise(s)</span>
                <div className="flex gap-3">
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
