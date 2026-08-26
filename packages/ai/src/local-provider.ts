import {
  designReviewResultSchema,
  restaurantBriefsSchema,
  websiteCorrectionPatchSchema,
  type DesignReviewResult,
  type RestaurantBriefs,
  type WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';

import type {
  AIProvider,
  AIProviderResult,
  DesignReviewRequest,
  RestaurantBriefRequest,
  WebsiteCorrectionRequest,
} from './types.js';

export class LocalAIProvider implements AIProvider {
  readonly name = 'local';
  readonly model = 'restaurant-deterministic-v1';
  readonly supportsVision = false;

  generateRestaurantBrief(
    request: RestaurantBriefRequest,
  ): Promise<AIProviderResult<RestaurantBriefs>> {
    const { business } = request;
    const city = business.address.city;
    const cuisine = business.cuisines[0];
    const hasContact = Object.values(business.contact).some(Boolean);
    const output = restaurantBriefsSchema.parse({
      content: {
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
      design: {
        tone: 'ELEGANT',
        primaryColor: '#17231B',
        accentColor: '#C89348',
        backgroundColor: '#FAF7F0',
        textColor: '#18201A',
        styleKeywords: ['éditorial', 'chaleureux', 'gastronomique'],
      },
    });
    return Promise.resolve({
      output,
      usage: { inputTokens: 0, outputTokens: 0, costMicros: 0 },
    });
  }

  reviewWebsiteDesign(
    request: DesignReviewRequest,
  ): Promise<AIProviderResult<DesignReviewResult>> {
    const blocking = request.browserReport.issues.filter(
      (issue) => issue.severity === 'BLOCKING',
    ).length;
    const high = request.browserReport.issues.filter(
      (issue) => issue.severity === 'HIGH',
    ).length;
    const base = Math.max(0, 92 - blocking * 30 - high * 12);
    const issues = request.browserReport.issues.map((issue) => ({
      code: issue.code,
      severity: issue.severity,
      category:
        issue.code === 'HORIZONTAL_OVERFLOW'
          ? ('MOBILE' as const)
          : ('PROFESSIONALISM' as const),
      message: issue.message,
      suggestion:
        issue.code === 'HORIZONTAL_OVERFLOW'
          ? 'Reduce wide content and keep sections inside the mobile viewport.'
          : 'Resolve the browser-level error before human approval.',
    }));
    const categoryScore = Math.max(0, Math.round(base / 10));
    const output = designReviewResultSchema.parse({
      score: base,
      categories: {
        visualHierarchy: 9,
        typography: 9,
        spacing: 9,
        colors: 9,
        cta: 9,
        mobile: request.browserReport.hasHorizontalOverflow ? 5 : 9,
        consistency: 9,
        industryFit: 9,
        accessibility: categoryScore,
        professionalism: categoryScore,
      },
      issues,
      summary:
        issues.length === 0
          ? 'The deterministic local review found a stable, responsive preview ready for human review.'
          : 'The deterministic local review found browser-level issues that require correction.',
    });
    return Promise.resolve({
      output,
      usage: { inputTokens: 0, outputTokens: 0, costMicros: 0 },
    });
  }

  proposeWebsiteCorrection(
    request: WebsiteCorrectionRequest,
  ): Promise<AIProviderResult<WebsiteCorrectionPatch>> {
    const hasMobileIssue = request.review.issues.some(
      (issue) => issue.category === 'MOBILE',
    );
    const output = websiteCorrectionPatchSchema.parse(
      hasMobileIssue
        ? {
            content: {
              headline: request.config.content.headline.slice(0, 60),
              subheadline: request.config.content.subheadline.slice(0, 130),
            },
          }
        : {},
    );
    return Promise.resolve({
      output,
      usage: { inputTokens: 0, outputTokens: 0, costMicros: 0 },
    });
  }
}
