'use server';

import {
  createRestaurantWebsiteRequestSchema,
  websiteIdSchema,
  websiteVersionIdSchema,
} from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';

import {
  createRestaurantWebsite,
  reviewWebsiteVersion,
  restoreWebsiteVersion,
  startDesignReview,
  startQualityReview,
} from '@/lib/api';

export type GenerationFormState = Readonly<{
  status: 'IDLE' | 'SUCCESS' | 'ERROR';
  message?: string;
  jobId?: string;
}>;

function value(formData: FormData, name: string): string {
  const input = formData.get(name);
  return typeof input === 'string' ? input.trim() : '';
}

export async function restoreVersionAction(formData: FormData): Promise<void> {
  const websiteId = websiteIdSchema.parse(value(formData, 'websiteId'));
  const versionId = websiteVersionIdSchema.parse(value(formData, 'versionId'));
  await restoreWebsiteVersion(websiteId, versionId);
  revalidatePath(`/websites/${websiteId}`);
  revalidatePath('/websites');
}

export async function reviewVersionAction(formData: FormData): Promise<void> {
  const websiteId = websiteIdSchema.parse(value(formData, 'websiteId'));
  const versionId = websiteVersionIdSchema.parse(value(formData, 'versionId'));
  const decision = value(formData, 'decision');
  if (decision !== 'approve' && decision !== 'reject') {
    throw new Error('Décision invalide.');
  }

  await reviewWebsiteVersion(websiteId, versionId, decision);
  revalidatePath('/websites');
}

export async function startDesignReviewAction(
  formData: FormData,
): Promise<void> {
  const websiteId = websiteIdSchema.parse(value(formData, 'websiteId'));
  const versionId = websiteVersionIdSchema.parse(value(formData, 'versionId'));
  await startDesignReview(websiteId, versionId);
  revalidatePath('/websites');
}

export async function startQualityReviewAction(
  formData: FormData,
): Promise<void> {
  const websiteId = websiteIdSchema.parse(value(formData, 'websiteId'));
  const versionId = websiteVersionIdSchema.parse(value(formData, 'versionId'));
  await startQualityReview(websiteId, versionId);
  revalidatePath('/websites');
}

export async function generateRestaurantAction(
  _previous: GenerationFormState,
  formData: FormData,
): Promise<GenerationFormState> {
  const email = value(formData, 'email');
  const phone = value(formData, 'phone');
  const parsed = createRestaurantWebsiteRequestSchema.safeParse({
    kind: 'RESTAURANT',
    name: value(formData, 'name'),
    slug: value(formData, 'slug'),
    tagline: value(formData, 'tagline') || undefined,
    description: value(formData, 'description'),
    cuisines: value(formData, 'cuisines')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    address: {
      street: value(formData, 'street'),
      postalCode: value(formData, 'postalCode'),
      city: value(formData, 'city'),
      countryCode: value(formData, 'countryCode'),
    },
    contact: {
      ...(email === '' ? {} : { email }),
      ...(phone === '' ? {} : { phone }),
    },
    openingHours: [],
    services: formData.getAll('services'),
    menuHighlights: [],
  });
  if (!parsed.success) {
    return {
      status: 'ERROR',
      message: parsed.error.issues[0]?.message ?? 'Formulaire invalide.',
    };
  }

  try {
    const created = await createRestaurantWebsite(parsed.data);
    revalidatePath('/');
    revalidatePath('/websites');
    return {
      status: 'SUCCESS',
      message:
        'Génération lancée. Le site apparaîtra dès que le worker aura terminé.',
      jobId: created.jobId,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message:
        error instanceof Error ? error.message : 'Génération impossible.',
    };
  }
}
