import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getClients, getProjects } from '@/lib/api';
import { attachWebsiteAction, deployAction } from './actions';

export const dynamic = 'force-dynamic';
export default async function ClientsPage() {
  const [{ clients }, { projects }] = await Promise.all([
    getClients().catch(() => ({ clients: [] })),
    getProjects().catch(() => ({ projects: [] })),
  ]);
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/" className="text-sm text-violet-700">
            ← Dashboard
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-600">
            Phase 7 · Delivery
          </p>
          <h1 className="text-3xl font-semibold">Clients et projets</h1>
          <p className="text-slate-500">
            La conversion exige une proposition approuvée.
          </p>
        </div>
        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Aucun client converti.
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <h2 className="font-semibold">{client.name}</h2>
                  <Badge>{client.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects
                  .filter((project) => project.clientId === client.id)
                  .map((project) => (
                    <div key={project.id} className="rounded-xl border p-4">
                      <div className="flex justify-between">
                        <strong>{project.name}</strong>
                        <Badge>{project.status}</Badge>
                      </div>
                      {project.websiteId && project.versionId ? (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500">
                            Website {project.websiteId}
                            <br />
                            Version {project.versionId}
                          </p>
                          <form
                            className="mt-3"
                            action={deployAction.bind(null, project.id)}
                          >
                            <Button type="submit">
                              Déployer la preview locale
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <form
                          action={attachWebsiteAction.bind(null, project.id)}
                          className="mt-3 grid gap-2"
                        >
                          <input
                            required
                            name="websiteId"
                            placeholder="Website UUID approuvé"
                            className="rounded-lg border p-2 text-sm"
                          />
                          <input
                            required
                            name="versionId"
                            placeholder="Version UUID approuvée"
                            className="rounded-lg border p-2 text-sm"
                          />
                          <Button type="submit">
                            Rattacher la version approuvée
                          </Button>
                        </form>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
