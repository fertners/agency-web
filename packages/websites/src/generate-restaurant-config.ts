import {
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
  type RestaurantBriefs,
  type RestaurantBusinessData,
  type RestaurantWebsiteConfig,
} from '@ai-web-agency/shared';

export function generateRestaurantConfig(
  input: RestaurantBusinessData,
  generatedAt = new Date(),
  briefs?: RestaurantBriefs,
): RestaurantWebsiteConfig {
  const business = restaurantBusinessDataSchema.parse(input);
  const cuisine = business.cuisines[0] ?? 'de saison';
  const city = business.address.city;

  return restaurantWebsiteConfigSchema.parse({
    schemaVersion: 1,
    business,
    content: briefs?.content ?? {
      headline: business.tagline ?? `${business.name}, une table à découvrir`,
      subheadline: `Une cuisine ${cuisine.toLocaleLowerCase('fr-FR')} servie avec générosité au cœur de ${city}.`,
      about: business.description,
      primaryCallToAction: business.services.includes('RESERVATIONS')
        ? 'Réserver une table'
        : 'Nous contacter',
      specialtiesHeading: 'Les assiettes du moment',
      seoTitle: `${business.name} — Restaurant à ${city}`.slice(0, 60),
      seoDescription:
        `${business.description} Découvrez la carte et les horaires de ${business.name} à ${city}.`.slice(
          0,
          160,
        ),
    },
    design: briefs?.design ?? {
      tone: 'ELEGANT',
      primaryColor: '#17231B',
      accentColor: '#C89348',
      backgroundColor: '#FAF7F0',
      textColor: '#18201A',
      styleKeywords: ['éditorial', 'chaleureux', 'gastronomique'],
    },
    sections: [
      'NAVBAR',
      'HERO',
      'ABOUT',
      ...(business.menuHighlights.length > 0 ? ['SPECIALTIES'] : []),
      ...(business.services.length > 0 ? ['SERVICES'] : []),
      ...(business.gallery.length > 0 ? ['GALLERY'] : []),
      ...(business.reviews.length > 0 ? ['REVIEWS'] : []),
      ...(business.openingHours.length > 0 ? ['OPENING_HOURS'] : []),
      'LOCATION',
      'CONTACT',
      'CTA',
      'FOOTER',
    ],
    generatedAt: generatedAt.toISOString(),
  });
}
