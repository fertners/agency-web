import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getTemplate } from '@/lib/api';

export const dynamic = 'force-dynamic';
export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id).catch(() => null);
  if (!template) notFound();
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/templates">
        ← Templates
      </a>
      <header className="my-6">
        <p className="text-sm font-semibold text-violet-600">
          {template.status} · V{template.version}
        </p>
        <h1 className="text-3xl font-bold">{template.name}</h1>
        <p className="mt-2 text-slate-500">
          {template.category} · {template.usage} utilisation(s)
        </p>
      </header>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Sections</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {template.sections.length ? (
              template.sections.map((section) => (
                <span
                  className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800"
                  key={section}
                >
                  {section}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Template non activé : aucune section supportée.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Statistiques</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Design moyen : {template.averageDesignScore ?? '—'}</p>
            <p>Approbation : {template.approvalRate}%</p>
            <p>Sites : {template.websiteIds.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Design tokens</h2>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(template.designTokens, null, 2)}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Sites utilisant cette version</h2>
          </CardHeader>
          <CardContent>
            {template.websiteIds.length ? (
              template.websiteIds.map((websiteId) => (
                <a
                  className="block text-sm font-semibold text-violet-700"
                  href={`/websites/${websiteId}`}
                  key={websiteId}
                >
                  {websiteId}
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aucun.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
