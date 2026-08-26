import type {
  CompanyCandidate,
  OpportunityAssessment,
  OpportunityComponents,
  ProspectSearchRequest,
} from '@ai-web-agency/shared';

export interface BusinessSearchProvider {
  readonly name: string;
  search(request: ProspectSearchRequest): Promise<CompanyCandidate[]>;
}

type OverpassElement = Readonly<{
  id?: number;
  type?: string;
  tags?: Record<string, string>;
}>;

function escapeOverpass(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function optionalUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function optionalEmail(value: string | undefined): string | undefined {
  return value !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? value
    : undefined;
}

export class OverpassBusinessSearchProvider implements BusinessSearchProvider {
  readonly name = 'openstreetmap-overpass';
  constructor(
    private readonly options: {
      endpoint?: string;
      userAgent?: string;
      fetcher?: typeof fetch;
    } = {},
  ) {}

  async search(request: ProspectSearchRequest): Promise<CompanyCandidate[]> {
    const city = escapeOverpass(request.city);
    const country = escapeOverpass(request.countryCode);
    const query = `[out:json][timeout:25];area["ISO3166-1"="${country}"][admin_level=2]->.country;area["name"="${city}"][boundary="administrative"](area.country)->.searchArea;nwr["amenity"="restaurant"]["name"](area.searchArea);out tags center qt ${request.limit};`;
    const response = await (this.options.fetcher ?? fetch)(
      this.options.endpoint ?? 'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent':
            this.options.userAgent ??
            'AIWebAgency/0.1 (local prospect research)',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok)
      throw new Error(`Overpass search failed with status ${response.status}`);
    const body: unknown = await response.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !Array.isArray((body as { elements?: unknown }).elements)
    )
      throw new Error('Overpass returned an invalid response');
    return (body as { elements: OverpassElement[] }).elements
      .map((element): CompanyCandidate | undefined => {
        const tags = element.tags;
        if (!tags?.name || element.id === undefined || !element.type)
          return undefined;
        const websiteUrl = optionalUrl(tags['contact:website'] ?? tags.website);
        return {
          source: this.name,
          externalId: `${element.type}/${element.id}`,
          name: tags.name,
          category: request.category,
          countryCode: request.countryCode,
          city: tags['addr:city'] ?? request.city,
          street: tags['addr:street'],
          postalCode: tags['addr:postcode'],
          websiteUrl,
          email: optionalEmail(tags['contact:email'] ?? tags.email),
          phone: tags['contact:phone'] ?? tags.phone,
          signals: { https: websiteUrl?.startsWith('https://') },
        };
      })
      .filter((candidate): candidate is CompanyCandidate => Boolean(candidate));
  }
}
export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityComponents = {
  websiteQuality: 25,
  mobile: 20,
  seo: 15,
  businessQuality: 15,
  missingFeatures: 15,
  contactability: 10,
};

function clean(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
export function companyFingerprint(
  candidate: Pick<CompanyCandidate, 'name' | 'city' | 'countryCode'>,
): string {
  return `${clean(candidate.name)}|${clean(candidate.city)}|${candidate.countryCode.toUpperCase()}`;
}
function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessOpportunity(
  candidate: CompanyCandidate,
  weights: OpportunityComponents = DEFAULT_OPPORTUNITY_WEIGHTS,
): OpportunityAssessment {
  const s = candidate.signals;
  const noWebsite = candidate.websiteUrl === undefined;
  const websiteQuality = noWebsite
    ? 100
    : clamp(
        25 +
          (s.https ? 25 : 0) +
          (s.loadTimeMs !== undefined && s.loadTimeMs < 2500 ? 30 : 0) +
          (s.hasTitle ? 20 : 0),
      );
  const mobile = noWebsite ? 100 : s.mobileFriendly ? 10 : 90;
  const seo = noWebsite
    ? 100
    : clamp(
        100 -
          (s.hasTitle ? 35 : 0) -
          (s.hasDescription ? 35 : 0) -
          (s.https ? 30 : 0),
      );
  const businessQuality = clamp(
    ((candidate.rating ?? 3) / 5) * 65 +
      Math.min(candidate.reviewCount ?? 0, 100) * 0.35,
  );
  const missingFeatures = clamp(
    (s.hasOnlineBooking ? 0 : 50) + (s.hasMenu ? 0 : 35) + (noWebsite ? 15 : 0),
  );
  const contactability = clamp(
    (candidate.email ? 45 : 0) +
      (candidate.phone ? 35 : 0) +
      (candidate.websiteUrl ? 20 : 0),
  );
  const components = {
    websiteQuality,
    mobile,
    seo,
    businessQuality,
    missingFeatures,
    contactability,
  };
  const totalWeight = Object.values(weights).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (totalWeight !== 100)
    throw new Error('Opportunity weights must total 100');
  const score = clamp(
    Object.entries(components).reduce(
      (sum, [key, value]) =>
        sum + value * weights[key as keyof OpportunityComponents],
      0,
    ) / 100,
  );
  const evidence = [
    noWebsite ? 'Aucun site web détecté' : 'Site web existant à améliorer',
    `${candidate.rating ?? 'Note inconnue'} · ${candidate.reviewCount ?? 0} avis`,
    candidate.email || candidate.phone
      ? 'Contact direct disponible'
      : 'Coordonnées directes manquantes',
  ];
  return {
    score,
    components,
    weights,
    evidence,
    summary:
      score >= 70
        ? 'Opportunité prioritaire : besoin numérique clair et activité crédible.'
        : score >= 45
          ? 'Opportunité à qualifier avant prise de contact.'
          : 'Opportunité faible selon les signaux disponibles.',
  };
}

const fixtures = [
  'L’Atelier des Saveurs',
  'Maison Sésame',
  'Le Comptoir Local',
  'Bistro des Amis',
  'Table & Saison',
];
export class LocalBusinessSearchProvider implements BusinessSearchProvider {
  readonly name = 'local-deterministic';
  search(request: ProspectSearchRequest): Promise<CompanyCandidate[]> {
    return Promise.resolve(
      fixtures.slice(0, request.limit).map((name, index) => ({
        source: this.name,
        externalId: `${clean(request.city)}-${index + 1}`,
        name,
        category: request.category,
        countryCode: request.countryCode,
        city: request.city,
        websiteUrl: index === 0 ? undefined : `https://example.com/${index}`,
        email: index % 2 === 0 ? `contact${index}@example.com` : undefined,
        phone: index % 3 === 0 ? `+3300000000${index}` : undefined,
        rating: 3.8 + index * 0.2,
        reviewCount: 18 + index * 13,
        signals:
          index === 0
            ? {}
            : {
                https: true,
                mobileFriendly: index > 2,
                hasTitle: true,
                hasDescription: index > 1,
                hasOnlineBooking: index > 3,
                hasMenu: index > 2,
                loadTimeMs: 3900 - index * 400,
              },
      })),
    );
  }
}
