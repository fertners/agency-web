'use server';
import { prospectSearchRequestSchema } from '@ai-web-agency/shared';
import { revalidatePath } from 'next/cache';
import { searchProspects } from '@/lib/api';
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
