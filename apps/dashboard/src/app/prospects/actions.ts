'use server';
import { prospectSearchRequestSchema } from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import { searchProspects } from '@/lib/api';
import { getJob, startProspectWorkflow } from '@/lib/api';
export async function searchProspectsAction(formData: FormData): Promise<void> {
  const parsed = prospectSearchRequestSchema.parse({
    city: formData.get('city'),
    countryCode: formData.get('countryCode'),
    category: 'RESTAURANT',
    limit: formData.get('limit'),
  });
  await searchProspects(parsed);
  revalidatePath('/prospects');
}

export async function launchProposalWorkflowsAction(prospectIds: string[]) {
  const uniqueIds = [...new Set(prospectIds)];
  if (uniqueIds.length === 0)
    return {
      ok: false as const,
      message: 'Sélectionnez au moins un prospect.',
    };
  const results = await Promise.allSettled(
    uniqueIds.map((id) =>
      startProspectWorkflow(id, {
        websiteType: 'SHOWCASE',
        currency: 'EUR',
        timelineDays: 14,
        scope: [
          'Site restaurant responsive',
          'Présentation de la carte et des informations pratiques',
          'Optimisation locale et formulaire de contact',
        ],
      }),
    ),
  );
  const jobs = results.flatMap((result, index) =>
    result.status === 'fulfilled'
      ? [{ prospectId: uniqueIds[index]!, jobId: result.value.jobId }]
      : [],
  );
  const failed = results.length - jobs.length;
  return {
    ok: failed === 0,
    message:
      failed === 0
        ? `${jobs.length} pipeline(s) de proposition lancée(s).`
        : `${jobs.length} pipeline(s) lancée(s), ${failed} échec(s).`,
    jobs,
  };
}

export async function getProposalWorkflowJobsAction(jobIds: string[]) {
  const uniqueIds = [...new Set(jobIds)].slice(0, 50);
  return Promise.all(uniqueIds.map((id) => getJob(id)));
}
