export default async function ProposalConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ decision?: string }>;
}) {
  const { decision } = await searchParams;
  const accepted = decision === 'ACCEPTED';
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-semibold">
          {accepted
            ? 'Merci pour votre confiance'
            : 'Votre choix est enregistré'}
        </h1>
        <p className="mt-4 text-slate-600">
          {accepted
            ? 'Nous vous contacterons pour organiser la suite du projet.'
            : 'Vos données commerciales ont été supprimées et vous ne serez plus contacté.'}
        </p>
      </div>
    </main>
  );
}
