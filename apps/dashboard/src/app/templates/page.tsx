import { Card, CardContent } from '@/components/ui/card';
import { getTemplates } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function TemplatesPage() {
  const result = await getTemplates().catch(() => null);
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">WEBSITE ENGINE</p>
        <h1 className="mt-1 text-3xl font-bold">Templates</h1>
        <p className="mt-2 text-slate-500">
          Thèmes normalisés, versions immuables et activation contrôlée.
        </p>
      </header>
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          {!result ? (
            <p className="py-10 text-center text-slate-500">
              API indisponible.
            </p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Nom</th>
                  <th>Catégorie</th>
                  <th>Version</th>
                  <th>Statut</th>
                  <th>Utilisation</th>
                  <th>Design moyen</th>
                  <th>Approbation</th>
                </tr>
              </thead>
              <tbody>
                {result.templates.map((template) => (
                  <tr className="border-b" key={template.id}>
                    <td className="py-4 font-semibold">
                      <a
                        className="text-violet-700"
                        href={`/templates/${template.id}`}
                      >
                        {template.name}
                      </a>
                    </td>
                    <td>{template.category}</td>
                    <td>V{template.version}</td>
                    <td>{template.status}</td>
                    <td>{template.usage}</td>
                    <td>{template.averageDesignScore ?? '—'}</td>
                    <td>{template.approvalRate}%</td>
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
