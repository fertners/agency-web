import { getProposalMessageTemplates } from './actions';
import { ProposalTemplateManager } from './proposal-template-manager';

export const dynamic = 'force-dynamic';
export default async function ProposalsPage() {
  const templates = await getProposalMessageTemplates().catch(() => []);
  return (
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-violet-600">
          MESSAGES COMMERCIAUX
        </p>
        <h1 className="mt-1 text-3xl font-bold">Proposals</h1>
        <p className="mt-2 text-slate-500">
          Créez et modifiez les canevas. Le plus récemment modifié est utilisé
          automatiquement.
        </p>
      </header>
      <ProposalTemplateManager templates={templates} />
    </main>
  );
}
