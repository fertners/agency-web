'use server';

import { agentJobIdSchema } from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';

import { cancelOperationsJob, retryOperationsJob } from '@/lib/api';

export async function retryJobAction(formData: FormData): Promise<void> {
  const id = agentJobIdSchema.parse(formData.get('jobId'));
  await retryOperationsJob(id);
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${id}`);
}

export async function cancelJobAction(formData: FormData): Promise<void> {
  const id = agentJobIdSchema.parse(formData.get('jobId'));
  await cancelOperationsJob(id);
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${id}`);
}
