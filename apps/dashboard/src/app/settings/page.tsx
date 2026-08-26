import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getSettings } from '@/lib/api';
import { saveSettingsAction } from './actions';

export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const result = await getSettings().catch(() => null);
  const grouped = result
    ? Object.groupBy(result.settings, (setting) => setting.section)
    : {};
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">CONFIGURATION</p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-slate-500">
          Les secrets restent exclusivement dans l’environnement ou un secret
          manager.
        </p>
      </header>
      {!result ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            API indisponible.
          </CardContent>
        </Card>
      ) : (
        <form action={saveSettingsAction} className="space-y-5">
          {Object.entries(grouped).map(([section, settings]) => (
            <Card key={section}>
              <CardHeader>
                <h2 className="font-semibold">{section}</h2>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {settings?.map((setting) => (
                  <label className="block" key={setting.key}>
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {setting.key}
                    </span>
                    {typeof setting.value === 'boolean' ? (
                      <select
                        className="w-full rounded-xl border px-3 py-2"
                        defaultValue={String(setting.value)}
                        name={setting.key}
                      >
                        <option value="true">Activé</option>
                        <option value="false">Désactivé</option>
                      </select>
                    ) : (
                      <input
                        className="w-full rounded-xl border px-3 py-2"
                        defaultValue={setting.value}
                        name={setting.key}
                        type={
                          typeof setting.value === 'number' ? 'number' : 'text'
                        }
                      />
                    )}
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}
          <button
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
            type="submit"
          >
            Enregistrer les réglages
          </button>
        </form>
      )}
    </main>
  );
}
