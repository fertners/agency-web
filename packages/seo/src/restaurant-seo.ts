import {
  seoAuditSchema,
  type QualityIssue,
  type RestaurantWebsiteConfig,
  type SeoAudit,
} from '@ai-web-agency/shared';

export function createRestaurantJsonLd(
  config: RestaurantWebsiteConfig,
  canonicalUrl: string,
) {
  const business = config.business;
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: business.name,
    description: config.content.seoDescription,
    url: canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      postalCode: business.address.postalCode,
      addressLocality: business.address.city,
      addressCountry: business.address.countryCode,
    },
    servesCuisine: business.cuisines,
    ...(business.contact.phone === undefined
      ? {}
      : { telephone: business.contact.phone }),
    ...(business.contact.email === undefined
      ? {}
      : { email: business.contact.email }),
    ...(business.heroImage === undefined
      ? {}
      : { image: business.heroImage.url }),
  } as const;
}

export function auditRestaurantSeo(
  config: RestaurantWebsiteConfig,
  canonicalUrl: string,
): SeoAudit {
  const checks = {
    titleLength:
      config.content.seoTitle.length >= 20 &&
      config.content.seoTitle.length <= 60,
    descriptionLength:
      config.content.seoDescription.length >= 70 &&
      config.content.seoDescription.length <= 160,
    singleH1: config.sections.includes('HERO'),
    canonical: URL.canParse(canonicalUrl),
    localIdentity: config.content.seoTitle
      .toLocaleLowerCase('fr-FR')
      .includes(config.business.address.city.toLocaleLowerCase('fr-FR')),
    imageAlts: [config.business.heroImage, ...config.business.gallery]
      .filter((image) => image !== undefined)
      .every((image) => image.alt.trim().length > 0),
    structuredData: true,
  };
  const messages: Record<keyof typeof checks, string> = {
    titleLength: 'Le title doit contenir entre 20 et 60 caractères.',
    descriptionLength:
      'La meta description doit contenir entre 70 et 160 caractères.',
    singleH1: 'Le rendu doit contenir un H1 principal.',
    canonical: 'L’URL canonical doit être valide.',
    localIdentity: 'Le title doit mentionner la ville.',
    imageAlts: 'Toutes les images doivent avoir un texte alternatif.',
    structuredData: 'Les données structurées Restaurant sont requises.',
  };
  const issues: QualityIssue[] = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([code]) => ({
      code: `SEO_${code.toUpperCase()}`,
      severity:
        code === 'singleH1' || code === 'canonical' ? 'ERROR' : 'WARNING',
      message: messages[code as keyof typeof checks],
      suggestion: 'Corriger la configuration SEO avant publication.',
    }));
  const score = Math.max(
    0,
    100 -
      issues.reduce(
        (total, issue) => total + (issue.severity === 'ERROR' ? 20 : 10),
        0,
      ),
  );
  return seoAuditSchema.parse({
    score,
    passed: score >= 85 && !issues.some((issue) => issue.severity === 'ERROR'),
    checks,
    issues,
  });
}
