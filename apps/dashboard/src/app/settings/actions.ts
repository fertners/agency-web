'use server';

import { revalidatePath } from 'next/cache';
import { getSettings, updateSettings } from '@/lib/api';

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const current = await getSettings();
  const settings = current.settings.map((setting) => {
    const raw = formData.get(setting.key);
    let value: string | number | boolean = setting.value;
    if (typeof setting.value === 'boolean') value = raw === 'true';
    else if (typeof setting.value === 'number') {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed))
        throw new Error(`Valeur invalide: ${setting.key}`);
      value = parsed;
    } else if (typeof raw === 'string') value = raw;
    return { key: setting.key, section: setting.section, value };
  });
  await updateSettings({ settings });
  revalidatePath('/settings');
}
