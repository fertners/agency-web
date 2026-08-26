import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  getDesignReviews,
  getQualityReports,
  getWebsites,
  getWebsiteVersions,
} from '@/lib/api';
import { startDesignReviewAction, startQualityReviewAction } from '../actions';

export const dynamic = 'force-dynamic';
export default async function WebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const website = await getWebsites()
    .then((r) => r.websites.find((item) => item.websiteId === id))
    .catch(() => undefined);
  if (!website) notFound();
  const versions = await getWebsiteVersions(id)
    .then((r) => r.versions)
    .catch(() => []);
  const details = await Promise.all(
    versions.map(async (version) => ({
      version,
      reviews: await getDesignReviews(id, version.versionId)
        .then((r) => r.reviews)
        .catch(() => []),
      reports: await getQualityReports(id, version.versionId)
        .then((r) => r.reports)
        .catch(() => []),
    })),
  );
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <a className="text-sm text-violet-600" href="/websites">
        ← Websites
      </a>
      <header className="my-6">
        <p className="text-sm font-semibold text-violet-600">WEBSITE</p>
        <h1 className="text-3xl font-bold">{website.name}</h1>
        <p className="mt-2 text-slate-500">
          {website.templateKey} · {website.status}
        </p>
      </header>
      <div className="space-y-5">
        {details.map(({ version, reviews, reports }) => {
          const review = reviews[0];
          const quality = reports[0];
          const generation = version.config.generation;
          return (
            <Card key={version.versionId}>
              <CardHeader>
                <div>
                  <h2 className="font-semibold">Version V{version.version}</h2>
                  <p className="text-sm text-slate-500">
                    {version.status} ·{' '}
                    {new Date(version.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <a
                  className="font-semibold text-violet-600"
                  href={`${process.env.PREVIEW_URL ?? 'http://127.0.0.1:3002'}/preview/${id}/${version.versionId}`}
                  target="_blank"
                >
                  Open Preview
                </a>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {generation ? (
                  <div className="rounded-xl bg-violet-50 p-4 md:col-span-3">
                    <p className="text-sm font-semibold text-violet-800">
                      Identité et thème
                    </p>
                    <div className="mt-2 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-slate-500">Thème sélectionné</p>
                        <p className="font-semibold">
                          {generation.theme.themeKey}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {generation.theme.reason}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Profil de marque</p>
                        <p className="font-semibold">
                          Confiance{' '}
                          {Math.round(generation.brand.confidence * 100)}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {generation.brand.sources.length} source(s) ·{' '}
                          {generation.brand.assets.length} asset(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Contenu vérifié</p>
                        <p className="font-semibold">
                          {generation.content.verifiedFacts.length} fait(s)
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {generation.content.omittedSections.length
                            ? `${generation.content.omittedSections.join(', ')} omise(s)`
                            : 'Toutes les sections disposent de données.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Design Review</p>
                  <p className="text-xl font-bold">
                    {review?.result?.score ?? '—'}
                  </p>
                  <form action={startDesignReviewAction}>
                    <input name="websiteId" type="hidden" value={id} />
                    <input
                      name="versionId"
                      type="hidden"
                      value={version.versionId}
                    />
                    <button className="mt-2 text-sm font-semibold text-violet-700">
                      Run Design Review
                    </button>
                  </form>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">SEO</p>
                  <p className="text-xl font-bold">
                    {quality?.report?.seo.score ?? '—'}
                  </p>
                  <form action={startQualityReviewAction}>
                    <input name="websiteId" type="hidden" value={id} />
                    <input
                      name="versionId"
                      type="hidden"
                      value={version.versionId}
                    />
                    <button className="mt-2 text-sm font-semibold text-violet-700">
                      Run SEO + QA
                    </button>
                  </form>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">QA</p>
                  <p className="text-xl font-bold">
                    {quality?.report?.score ?? '—'}
                  </p>
                  <p className="mt-2 text-sm">{quality?.status ?? 'NOT_RUN'}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
