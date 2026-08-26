import type { OpportunityAssessment } from '@ai-web-agency/shared';

type ProposalContentInput = Readonly<{
  companyName: string;
  assessment: OpportunityAssessment;
  previewUrl: string;
  priceCents: number;
  currency: string;
  timelineDays: number;
  scope: string[];
}>;

const SCORE_LABELS = {
  websiteQuality: 'qualité générale du site',
  mobile: 'expérience mobile',
  seo: 'visibilité SEO',
  businessQuality: 'présentation de l’activité',
  missingFeatures: 'fonctionnalités manquantes',
  contactability: 'facilité de contact',
} as const;

export function buildCommercialProposalContent(input: ProposalContentInput) {
  const negativeEvidence = input.assessment.evidence.filter((evidence) => {
    const normalized = evidence.toLocaleLowerCase('fr-FR');
    const explicitlyNegative =
      /aucun|absent|manquant|sans|inconnu|faible|lent|erreur|problème|pas de/.test(
        normalized,
      );
    const explicitlyPositive =
      /disponible|présent|valide|excellent|bon score/.test(normalized);
    return explicitlyNegative || !explicitlyPositive;
  });
  const scoredIssues = Object.entries(input.assessment.components)
    .filter(([, score]) => score < 60)
    .map(
      ([key, score]) =>
        `${SCORE_LABELS[key as keyof typeof SCORE_LABELS]} : ${score}/100`,
    );
  const issues = [...new Set([...negativeEvidence, ...scoredIssues])]
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 8);
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: input.currency,
  }).format(input.priceCents / 100);
  const issueLines = issues.map((issue) => `- ${issue}`).join('\n');
  const scopeLines = input.scope.map((item) => `- ${item}`).join('\n');
  return {
    title: `Proposition de site pour ${input.companyName}`,
    summary: `Une proposition personnalisée à partir d’une analyse notée ${input.assessment.score}/100, à valider avant envoi.`,
    issues,
    message: `Bonjour,

Nous accompagnons les entreprises locales dans la création de sites web professionnels. Notre analyse de la présence en ligne de ${input.companyName} a obtenu un score d’opportunité de ${input.assessment.score}/100.

Les points relevés par notre outil d’analyse sont :
${issueLines}

Nous avons préparé une proposition de site adaptée à votre activité. Vous pouvez la prévisualiser ici : ${input.previewUrl}

La prestation comprend :
${scopeLines}

Devis : ${formattedPrice}
Délai estimé : ${input.timelineDays} jours

Cette proposition ne vous engage pas. Consultez-la et répondez ici : {PROPOSAL_LINK}

Cordialement,
L’équipe AI Web Agency`,
  };
}
