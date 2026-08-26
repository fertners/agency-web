import {
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
  type RestaurantBriefs,
  type RestaurantBusinessData,
  type RestaurantWebsiteConfig,
  type WebsiteGenerationContext,
} from '@ai-web-agency/shared';

import { findRestaurantTheme } from './restaurant-themes.js';

export function generateRestaurantConfig(
  input: RestaurantBusinessData,
  generatedAt = new Date(),
  briefs?: RestaurantBriefs,
  generation?: WebsiteGenerationContext,
): RestaurantWebsiteConfig {
  const business = restaurantBusinessDataSchema.parse(input);
  const cuisine = business.cuisines[0];
  const city = business.address.city;
  const hasContact = Object.values(business.contact).some(Boolean);
  const selectedTheme =
    generation === undefined
      ? undefined
      : findRestaurantTheme(generation.theme.themeKey);
  const brand = generation?.brand;
  const themeDesign = selectedTheme?.design;
  const customizedDesign =
    themeDesign === undefined
      ? briefs?.design
      : {
          ...themeDesign,
          ...(brand?.colors[0] === undefined
            ? {}
            : { primaryColor: brand.colors[0] }),
          ...(brand?.colors[1] === undefined
            ? {}
            : { accentColor: brand.colors[1] }),
          ...(brand?.headingFont === undefined
            ? {}
            : { headingFont: brand.headingFont }),
          ...(brand?.bodyFont === undefined
            ? {}
            : { bodyFont: brand.bodyFont }),
          styleKeywords: [
            ...new Set([
              ...themeDesign.styleKeywords,
              ...(brand?.styleKeywords ?? []),
            ]),
          ].slice(0, 6),
        };

  return restaurantWebsiteConfigSchema.parse({
    schemaVersion: 1,
    business,
    content: briefs?.content ?? {
      headline: business.tagline ?? `${business.name}, une table à découvrir`,
      subheadline:
        cuisine === undefined
          ? `${business.name}, restaurant à ${city}.`
          : `Une cuisine ${cuisine.toLocaleLowerCase('fr-FR')} servie avec générosité au cœur de ${city}.`,
      about: business.description,
      primaryCallToAction: business.services.includes('RESERVATIONS')
        ? 'Réserver une table'
        : hasContact
          ? 'Nous contacter'
          : 'Nous trouver',
      specialtiesHeading: 'Les assiettes du moment',
      seoTitle: `${business.name} — Restaurant à ${city}`.slice(0, 60),
      seoDescription:
        `${business.description} ${business.name}, restaurant à ${city}.`.slice(
          0,
          160,
        ),
    },
    design: customizedDesign ?? {
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
      ...(hasContact ? ['CONTACT'] : []),
      'CTA',
      'FOOTER',
    ],
    ...(generation === undefined ? {} : { generation }),
    generatedAt: generatedAt.toISOString(),
  });
}
