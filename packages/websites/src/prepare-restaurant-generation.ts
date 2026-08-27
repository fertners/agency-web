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

const MEDITERRANEAN_SIGNALS = [
  'grec',
  'grecque',
  'méditerranéen',
  'méditerranéenne',
  'souvlaki',
  'mezze',
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
  const mediterranean = MEDITERRANEAN_SIGNALS.filter((signal) =>
    searchable.includes(signal),
  );
  return themeSelectionSchema.parse({
    themeKey: 'restaurant-mediterranean-v1',
    reason:
      'Application du thème restaurant standard sombre et safran, personnalisable avec les éléments vérifiés de la marque.',
    usedCategoryFallback: mediterranean.length === 0,
    matchedSignals: mediterranean,
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
