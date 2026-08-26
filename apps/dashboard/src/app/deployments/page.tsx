import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getDeployments } from '@/lib/api';
import { rollbackAction } from '../clients/actions';

export const dynamic = 'force-dynamic';
export default async function DeploymentsPage() {
  const { deployments } = await getDeployments().catch(() => ({
    deployments: [],
  }));
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/clients" className="text-sm text-violet-700">
            ← Clients
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-600">
            Phase 7 · Local provider
          </p>
          <h1 className="text-3xl font-semibold">Déploiements</h1>
          <p className="text-slate-500">
            Historique immuable et rollback explicite.
          </p>
        </div>
        {deployments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Aucun déploiement.
            </CardContent>
          </Card>
        ) : (
          deployments.map((deployment) => (
            <Card key={deployment.id}>
              <CardHeader>
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>
                    {deployment.environment} · {deployment.provider}
                  </strong>
                  <div className="flex gap-2">
                    <Badge>{deployment.status}</Badge>
                    {deployment.isActive && <Badge>ACTIVE</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">
                  Version {deployment.versionId}
                </p>
                {deployment.url && (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-sm text-violet-700 hover:underline"
                  >
                    {deployment.url}
                  </a>
                )}
                {deployment.status === 'COMPLETED' && !deployment.isActive && (
                  <form
                    className="mt-3"
                    action={rollbackAction.bind(
                      null,
                      deployment.projectId,
                      deployment.id,
                    )}
                  >
                    <Button type="submit" variant="outline">
                      Restaurer cette version
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
