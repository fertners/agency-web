'use server';

import {
  attachProjectWebsiteRequestSchema,
  createDeploymentRequestSchema,
  rollbackDeploymentRequestSchema,
} from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import {
  attachProjectWebsite,
  createDeployment,
  rollbackDeployment,
} from '@/lib/api';

export async function attachWebsiteAction(
  projectId: string,
  formData: FormData,
) {
  await attachProjectWebsite(
    projectId,
    attachProjectWebsiteRequestSchema.parse({
      websiteId: formData.get('websiteId'),
      versionId: formData.get('versionId'),
    }),
  );
  revalidatePath('/clients');
}
export async function deployAction(projectId: string) {
  await createDeployment(
    projectId,
    createDeploymentRequestSchema.parse({ environment: 'PREVIEW' }),
  );
  revalidatePath('/clients');
  revalidatePath('/deployments');
}
export async function rollbackAction(projectId: string, deploymentId: string) {
  await rollbackDeployment(
    projectId,
    rollbackDeploymentRequestSchema.parse({
      targetDeploymentId: deploymentId,
    }),
  );
  revalidatePath('/deployments');
}
