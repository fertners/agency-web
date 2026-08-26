import {
  brandProfileSchema,
  contentProfileSchema,
  restaurantBusinessDataSchema,
  themeSelectionSchema,
  websiteGenerationContextSchema,
  type BrandProfile,
  type RestaurantBusinessData,
  type ThemeSelection,
  type WebsiteGenerationContext,
} from '@ai-web-agency/shared';

const MODERN_SIGNALS = ['moderne', 'contemporain', 'fusion', 'street food'];
const CHEFS_KITCHEN_SIGNALS = [
  'pizza',
  'burger',
  'street food',
  'décontracté',
  'casual',
];
const WARM_SIGNALS = [
  'familial',
  'traditionnel',
  'bistrot',
  'italien',
  'méditerranéen',
  'authentique',
];

function deriveBrandProfile(
  business: RestaurantBusinessData,
  capturedAt = new Date(),
): BrandProfile {
  if (business.brandProfile !== undefined) {
    return brandProfileSchema.parse(business.brandProfile);
  }

  const sourceId = 'user-provided-business-data';
  const assets = [
    ...(business.heroImage === undefined
      ? []
      : [{ type: 'HERO' as const, ...business.heroImage }]),
    ...business.gallery.map((image) => ({
      type: 'GALLERY' as const,
      ...image,
    })),
  ].map((asset) => ({
    ...asset,
    sourceId,
    usageStatus: 'VERIFIED' as const,
  }));

  return brandProfileSchema.parse({
    businessName: business.name,
    category: 'RESTAURANT',
    colors: [],
    styleKeywords: [],
    assets,
    confidence: 0.35,
    sources: [
      {
        id: sourceId,
        type: 'USER_PROVIDED',
        capturedAt: capturedAt.toISOString(),
        claims: [
          'identity',
          'description',
          'location',
          'contact',
          ...(business.openingHours.length > 0 ? ['opening-hours'] : []),
          ...(business.menuHighlights.length > 0 ? ['menu'] : []),
          ...(business.reviews.length > 0 ? ['reviews'] : []),
        ],
      },
    ],
  });
}

export function selectRestaurantTheme(
  businessInput: RestaurantBusinessData,
  brandInput?: BrandProfile,
): ThemeSelection {
  const business = restaurantBusinessDataSchema.parse(businessInput);
  const brand = brandProfileSchema.parse(
    brandInput ?? deriveBrandProfile(business),
  );
  const searchable = [
    business.tagline,
    business.description,
    ...business.cuisines,
    ...brand.styleKeywords,
  ]
    .filter((value): value is string => value !== undefined)
    .join(' ')
    .toLocaleLowerCase('fr-FR');
  const modern = MODERN_SIGNALS.filter((signal) => searchable.includes(signal));
  const chefsKitchen = CHEFS_KITCHEN_SIGNALS.filter((signal) =>
    searchable.includes(signal),
  );
  const warm = WARM_SIGNALS.filter((signal) => searchable.includes(signal));

  if (chefsKitchen.length > 0) {
    return themeSelectionSchema.parse({
      themeKey: 'restaurant-chefs-kitchen-v1',
      reason:
        "Les signaux culinaires correspondent au thème MIT normalisé Chef's Kitchen.",
      usedCategoryFallback: false,
      matchedSignals: chefsKitchen,
    });
  }

  if (modern.length > warm.length && modern.length > 0) {
    return themeSelectionSchema.parse({
      themeKey: 'restaurant-modern-v1',
      reason:
        'Les signaux de marque correspondent au thème restaurant moderne.',
      usedCategoryFallback: false,
      matchedSignals: modern,
    });
  }
  if (warm.length > 0) {
    return themeSelectionSchema.parse({
      themeKey: 'restaurant-warm-v1',
      reason:
        'Les signaux de marque correspondent au thème restaurant chaleureux.',
      usedCategoryFallback: false,
      matchedSignals: warm,
    });
  }
  return themeSelectionSchema.parse({
    themeKey: 'restaurant-elegant-v1',
    reason:
      'Aucun signal de marque suffisamment précis : application du thème Restaurant par défaut.',
    usedCategoryFallback: true,
    matchedSignals: [],
  });
}

export function prepareRestaurantGeneration(
  businessInput: RestaurantBusinessData,
  capturedAt = new Date(),
): WebsiteGenerationContext {
  const business = restaurantBusinessDataSchema.parse(businessInput);
  const brand = deriveBrandProfile(business, capturedAt);
  const theme = selectRestaurantTheme(business, brand);
  const sourceIds = brand.sources.map(({ id }) => id);
  const omittedSections = [
    ...(business.menuHighlights.length === 0 ? ['SPECIALTIES'] : []),
    ...(business.gallery.length === 0 ? ['GALLERY'] : []),
    ...(business.reviews.length === 0 ? ['REVIEWS'] : []),
    ...(business.openingHours.length === 0 ? ['OPENING_HOURS'] : []),
  ];
  const warnings = omittedSections.map(
    (section) => `${section} omise : aucune donnée vérifiée disponible.`,
  );

  const content = contentProfileSchema.parse({
    sourceIds,
    verifiedFacts: brand.sources.flatMap(({ claims }) => claims),
    omittedSections,
    warnings,
  });
  return websiteGenerationContextSchema.parse({ brand, content, theme });
}
