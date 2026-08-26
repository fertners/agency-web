import { Card, CardContent } from '@/components/ui/card';
import { getQualityReports, getWebsites, getWebsiteVersions } from '@/lib/api';

export const dynamic = 'force-dynamic';
export default async function SeoPage() {
  const { websites } = await getWebsites().catch(() => ({ websites: [] }));
  const rows = await Promise.all(
    websites.map(async (website) => {
      const versions = await getWebsiteVersions(website.websiteId)
        .then((r) => r.versions)
        .catch(() => []);
      const latest = [...versions].sort((a, b) => b.version - a.version)[0];
      if (!latest) return { website, latest: null, report: null };
      const reports = await getQualityReports(
        website.websiteId,
        latest.versionId,
      )
        .then((r) => r.reports)
        .catch(() => []);
      return { website, latest, report: reports[0] ?? null };
    }),
  );
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">
          MOTEUR DÉTERMINISTE + IA
        </p>
        <h1 className="mt-1 text-3xl font-bold">SEO</h1>
        <p className="mt-2 text-slate-500">
          Rapports techniques transparents liés aux versions de Website.
        </p>
      </header>
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="pb-3">Website</th>
                <th>SEO Score</th>
                <th>Critical Issues</th>
                <th>Warnings</th>
                <th>Last Scan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ website, latest, report }) => {
                const issues = report?.report?.seo.issues ?? [];
                return (
                  <tr className="border-b" key={website.websiteId}>
                    <td className="py-4">
                      <a
                        className="font-semibold text-violet-700"
                        href={`/websites/${website.websiteId}`}
                      >
                        {website.name}
                      </a>
                    </td>
                    <td>{report?.report?.seo.score ?? '—'}</td>
                    <td>
                      {
                        issues.filter(
                          (issue) =>
                            issue.severity === 'ERROR' ||
                            issue.severity === 'BLOCKING',
                        ).length
                      }
                    </td>
                    <td>
                      {
                        issues.filter((issue) => issue.severity === 'WARNING')
                          .length
                      }
                    </td>
                    <td>
                      {report
                        ? new Date(report.createdAt).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td>
                      {report?.status ?? (latest ? 'NOT_RUN' : 'NO_VERSION')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
