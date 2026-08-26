import { ArrowLeft, ExternalLink, Globe2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  getDesignReviews,
  getQualityReports,
  getWebsites,
  getWebsiteVersions,
} from '@/lib/api';

import {
  reviewVersionAction,
  startDesignReviewAction,
  startQualityReviewAction,
} from './actions';
import { GenerationForm } from './generation-form';

export const dynamic = 'force-dynamic';

function previewUrl(websiteId: string, versionId: string): string {
  const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:3002';
  return `${base}/preview/${websiteId}/${versionId}`;
}

function artifactUrl(
  websiteId: string,
  versionId: string,
  reviewId: string,
  kind: 'desktop' | 'mobile',
): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
  return `${base}/websites/${websiteId}/versions/${versionId}/design-reviews/${reviewId}/artifacts/${kind}`;
}

export default async function WebsitesPage() {
  const result = await getWebsites().catch(() => ({ websites: [] }));
  const versionEntries = await Promise.all(
    result.websites.map(
      async (website) =>
        [
          website.websiteId,
          await getWebsiteVersions(website.websiteId)
            .then(({ versions }) => versions)
            .catch(() => []),
        ] as const,
    ),
  );
  const versionsByWebsite = new Map(versionEntries);
  const reviewEntries = await Promise.all(
    versionEntries.flatMap(([websiteId, versions]) =>
      versions.map(
        async (version) =>
          [
            version.versionId,
            await getDesignReviews(websiteId, version.versionId)
              .then(({ reviews }) => reviews)
              .catch(() => []),
          ] as const,
      ),
    ),
  );
  const reviewsByVersion = new Map(reviewEntries);
  const qualityEntries = await Promise.all(
    versionEntries.flatMap(([websiteId, versions]) =>
      versions.map(
        async (version) =>
          [
            version.versionId,
            await getQualityReports(websiteId, version.versionId)
              .then(({ reports }) => reports)
              .catch(() => []),
          ] as const,
      ),
    ),
  );
  const qualityByVersion = new Map(qualityEntries);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
        >
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              PHASE 4 · SEO + QA
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Sites restaurants
            </h1>
            <p className="mt-2 text-slate-500">
              Créez une fiche structurée, lancez le worker et ouvrez la version
              générée.
            </p>
          </div>
          <Link
            href="/websites"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          >
            <RefreshCw size={15} /> Actualiser
          </Link>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card>
            <CardHeader>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Sites persistés
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Les versions restent disponibles après chaque génération.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-600">
                {result.websites.length}
              </Badge>
            </CardHeader>
            <CardContent>
              {result.websites.length === 0 ? (
                <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                  <div>
                    <Globe2 className="mx-auto mb-3" />
                    <p>Aucun site pour le moment.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.websites.map((website) => (
                    <article
                      key={website.websiteId}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {website.name}
                          </h3>
                          <Badge
                            className={
                              website.status === 'READY'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }
                          >
                            {website.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {website.slug} · {website.templateKey}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {website.websiteId}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(versionsByWebsite.get(website.websiteId) ?? []).map(
                            (version) => (
                              <div
                                key={version.versionId}
                                className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <a
                                    href={previewUrl(
                                      website.websiteId,
                                      version.versionId,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-violet-700 hover:underline"
                                  >
                                    V{version.version}
                                  </a>
                                  <span className="text-slate-500">
                                    {version.status}
                                  </span>
                                  {version.status === 'APPROVED' ? null : (
                                    <form
                                      action={reviewVersionAction}
                                      className="flex gap-1"
                                    >
                                      <input
                                        type="hidden"
                                        name="websiteId"
                                        value={website.websiteId}
                                      />
                                      <input
                                        type="hidden"
                                        name="versionId"
                                        value={version.versionId}
                                      />
                                      <button
                                        name="decision"
                                        value="approve"
                                        className="font-medium text-emerald-700 hover:underline"
                                      >
                                        Approuver
                                      </button>
                                      {version.status === 'REJECTED' ? null : (
                                        <button
                                          name="decision"
                                          value="reject"
                                          className="font-medium text-rose-700 hover:underline"
                                        >
                                          Rejeter
                                        </button>
                                      )}
                                    </form>
                                  )}
                                  <form action={startDesignReviewAction}>
                                    <input
                                      type="hidden"
                                      name="websiteId"
                                      value={website.websiteId}
                                    />
                                    <input
                                      type="hidden"
                                      name="versionId"
                                      value={version.versionId}
                                    />
                                    <button className="font-medium text-blue-700 hover:underline">
                                      Analyser
                                    </button>
                                  </form>
                                  <form action={startQualityReviewAction}>
                                    <input
                                      type="hidden"
                                      name="websiteId"
                                      value={website.websiteId}
                                    />
                                    <input
                                      type="hidden"
                                      name="versionId"
                                      value={version.versionId}
                                    />
                                    <button className="font-medium text-fuchsia-700 hover:underline">
                                      SEO + QA
                                    </button>
                                  </form>
                                </div>
                                {(qualityByVersion.get(version.versionId) ?? [])
                                  .slice(0, 1)
                                  .map((quality) => (
                                    <div
                                      key={quality.reportId}
                                      className="mt-2 border-t border-slate-200 pt-2 text-slate-600"
                                    >
                                      Quality {quality.status}
                                      {quality.report === null
                                        ? ''
                                        : ` · ${quality.report.score}/100`}
                                      {quality.report === null ? null : (
                                        <p className="mt-1">
                                          SEO {quality.report.seo.score} ·
                                          Accessibilité{' '}
                                          {quality.report.accessibility.score} ·
                                          Performance{' '}
                                          {quality.report.performance.score}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                {(reviewsByVersion.get(version.versionId) ?? [])
                                  .slice(0, 1)
                                  .map((review) => (
                                    <div
                                      key={review.reviewId}
                                      className="mt-2 border-t border-slate-200 pt-2 text-slate-600"
                                    >
                                      Analyse {review.status} · itération{' '}
                                      {review.iteration}
                                      {review.result === null
                                        ? ''
                                        : ` · ${review.result.score}/100`}
                                      {review.result === null ? null : (
                                        <p className="mt-1 max-w-md">
                                          {review.result.summary}
                                        </p>
                                      )}
                                      {review.browserReport === null ? null : (
                                        <p className="mt-1 flex gap-3">
                                          <a
                                            className="font-medium text-blue-700 hover:underline"
                                            target="_blank"
                                            rel="noreferrer"
                                            href={artifactUrl(
                                              website.websiteId,
                                              version.versionId,
                                              review.reviewId,
                                              'desktop',
                                            )}
                                          >
                                            Capture desktop
                                          </a>
                                          <a
                                            className="font-medium text-blue-700 hover:underline"
                                            target="_blank"
                                            rel="noreferrer"
                                            href={artifactUrl(
                                              website.websiteId,
                                              version.versionId,
                                              review.reviewId,
                                              'mobile',
                                            )}
                                          >
                                            Capture mobile
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      {website.latestVersion !== null ? (
                        <a
                          href={previewUrl(
                            website.websiteId,
                            website.latestVersion.versionId,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Preview V{website.latestVersion.version}{' '}
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        <span className="text-sm text-amber-600">
                          Génération en cours
                        </span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Nouveau restaurant
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Les horaires, menus et images seront enrichis dans les
                  prochaines itérations.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <GenerationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
