import {
  restaurantWebsiteConfigSchema,
  websiteCorrectionPatchSchema,
  type RestaurantWebsiteConfig,
  type WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';

export function applyWebsiteCorrection(
  config: RestaurantWebsiteConfig,
  input: WebsiteCorrectionPatch,
): RestaurantWebsiteConfig {
  const patch = websiteCorrectionPatchSchema.parse(input);
  return restaurantWebsiteConfigSchema.parse({
    ...config,
    content: { ...config.content, ...patch.content },
    design: { ...config.design, ...patch.design },
    sections: patch.sections ?? config.sections,
    generatedAt: new Date().toISOString(),
  });
}
