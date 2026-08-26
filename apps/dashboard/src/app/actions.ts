'use server';

import { revalidatePath } from 'next/cache';

import { createDiagnosticJob } from '@/lib/api';

export async function createDiagnosticAction(): Promise<void> {
  await createDiagnosticJob();
  revalidatePath('/');
}
