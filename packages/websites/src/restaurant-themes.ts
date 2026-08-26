import {
  restaurantDesignBriefSchema,
  restaurantThemeKeySchema,
  type RestaurantDesignBrief,
  type RestaurantThemeKey,
} from '@ai-web-agency/shared';

export type RestaurantTheme = Readonly<{
  key: RestaurantThemeKey;
  name: string;
  category: 'RESTAURANT';
  status: 'ACTIVE';
  source: Readonly<{
    kind: 'INTERNAL' | 'NORMALIZED_MIT';
    url?: string;
    commit?: string;
    license: 'INTERNAL' | 'MIT';
  }>;
  design: RestaurantDesignBrief;
}>;

function theme(
  key: RestaurantThemeKey,
  name: string,
  design: RestaurantDesignBrief,
  source: RestaurantTheme['source'] = {
    kind: 'INTERNAL',
    license: 'INTERNAL',
  },
): RestaurantTheme {
  return {
    key: restaurantThemeKeySchema.parse(key),
    name,
    category: 'RESTAURANT',
    status: 'ACTIVE',
    source,
    design: restaurantDesignBriefSchema.parse(design),
  };
}

export const RESTAURANT_THEMES: readonly RestaurantTheme[] = [
  theme('restaurant-elegant-v1', 'Restaurant Editorial', {
    tone: 'ELEGANT',
    primaryColor: '#17231B',
    accentColor: '#C89348',
    backgroundColor: '#FAF7F0',
    textColor: '#18201A',
    headingFont: 'Georgia, serif',
    bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
    buttonRadius: 'PILL',
    heroLayout: 'OVERLAY',
    styleKeywords: ['éditorial', 'élégant', 'gastronomique'],
  }),
  theme('restaurant-warm-v1', 'Restaurant Maison', {
    tone: 'WARM',
    primaryColor: '#6D2E1C',
    accentColor: '#E0A458',
    backgroundColor: '#FFF8ED',
    textColor: '#2F211C',
    headingFont: 'Georgia, serif',
    bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
    buttonRadius: 'SOFT',
    heroLayout: 'OVERLAY',
    styleKeywords: ['chaleureux', 'familial', 'authentique'],
  }),
  theme('restaurant-modern-v1', 'Restaurant Studio', {
    tone: 'MODERN',
    primaryColor: '#111827',
    accentColor: '#84CC16',
    backgroundColor: '#F8FAFC',
    textColor: '#111827',
    headingFont: 'Arial, sans-serif',
    bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
    buttonRadius: 'NONE',
    heroLayout: 'OVERLAY',
    styleKeywords: ['moderne', 'minimal', 'contemporain'],
  }),
  theme(
    'restaurant-chefs-kitchen-v1',
    "Restaurant Chef's Kitchen",
    {
      tone: 'PLAYFUL',
      primaryColor: '#DF6853',
      accentColor: '#F2B84B',
      backgroundColor: '#F9FAFB',
      textColor: '#111111',
      headingFont: 'Arial, sans-serif',
      bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
      buttonRadius: 'PILL',
      heroLayout: 'SPLIT',
      styleKeywords: ['convivial', 'culinaire', 'lumineux', 'décontracté'],
    },
    {
      kind: 'NORMALIZED_MIT',
      url: 'https://github.com/GetNextjsTemplates/chef-kitchen-nextjs-landing-page-template',
      commit: '2910c50abefa7a367015697f4cd5b96be95771fb',
      license: 'MIT',
    },
  ),
] as const;

export function findRestaurantTheme(key: RestaurantThemeKey): RestaurantTheme {
  const selected = RESTAURANT_THEMES.find((item) => item.key === key);
  if (selected === undefined) throw new Error(`Unknown theme: ${key}`);
  return selected;
}
