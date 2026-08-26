import {
  designReviewResultSchema,
  restaurantBriefsSchema,
  websiteCorrectionPatchSchema,
  type DesignReviewResult,
  type RestaurantBriefs,
  type WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import type {
  AIProvider,
  AIProviderResult,
  DesignReviewRequest,
  RestaurantBriefRequest,
  WebsiteCorrectionRequest,
} from './types.js';

const BASE_INSTRUCTIONS = [
  'Tu travailles pour une agence web responsable.',
  'N’invente jamais de fait sur une entreprise.',
  'Utilise uniquement les données fournies.',
  'Ne transforme jamais une suggestion en garantie commerciale ou SEO.',
  'Réponds dans le format structuré demandé.',
].join(' ');

type OpenAIProviderOptions = Readonly<{
  apiKey: string;
  model: string;
  client?: OpenAI;
}>;

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly supportsVision = true;
  private readonly client: OpenAI;

  constructor(options: OpenAIProviderOptions) {
    this.model = options.model;
    this.client = options.client ?? new OpenAI({ apiKey: options.apiKey });
  }

  async generateRestaurantBrief(
    request: RestaurantBriefRequest,
  ): Promise<AIProviderResult<RestaurantBriefs>> {
    return this.runStructured(
      restaurantBriefsSchema,
      'restaurant_brief',
      [
        BASE_INSTRUCTIONS,
        'Rédige le contenu concis d’un site de restaurant et une direction artistique.',
        'Les couleurs doivent être lisibles et cohérentes avec le profil de marque lorsqu’il existe.',
        'N’ajoute ni avis, ni menu, ni service, ni horaire absent des données.',
      ].join(' '),
      { business: request.business },
    );
  }

  async reviewWebsiteDesign(
    request: DesignReviewRequest,
  ): Promise<AIProviderResult<DesignReviewResult>> {
    return this.runStructured(
      designReviewResultSchema,
      'website_design_review',
      [
        BASE_INSTRUCTIONS,
        'Évalue la qualité visuelle et professionnelle du site à partir de sa configuration et du rapport navigateur.',
        'Toute erreur bloquante du navigateur doit rester bloquante.',
        'Le score doit être transparent et les corrections actionnables.',
      ].join(' '),
      { config: request.config, browserReport: request.browserReport },
      request.screenshots,
    );
  }

  async proposeWebsiteCorrection(
    request: WebsiteCorrectionRequest,
  ): Promise<AIProviderResult<WebsiteCorrectionPatch>> {
    return this.runStructured(
      websiteCorrectionPatchSchema,
      'website_correction',
      [
        BASE_INSTRUCTIONS,
        'Propose uniquement un patch de configuration sûr et minimal pour corriger les problèmes du rapport.',
        'Ne change aucun fait métier et ne fournis jamais de code exécutable.',
      ].join(' '),
      { config: request.config, review: request.review },
    );
  }

  private async runStructured<T>(
    schema: Parameters<typeof zodTextFormat>[0],
    schemaName: string,
    instructions: string,
    input: Record<string, unknown>,
    screenshots?: readonly { mimeType: 'image/png'; base64: string }[],
  ): Promise<AIProviderResult<T>> {
    const userInput =
      screenshots === undefined || screenshots.length === 0
        ? JSON.stringify(input)
        : [
            { type: 'input_text' as const, text: JSON.stringify(input) },
            ...screenshots.map((screenshot) => ({
              type: 'input_image' as const,
              image_url: `data:${screenshot.mimeType};base64,${screenshot.base64}`,
              detail: 'low' as const,
            })),
          ];
    const response = await this.client.responses.parse({
      model: this.model,
      store: false,
      instructions,
      input:
        typeof userInput === 'string'
          ? userInput
          : [{ role: 'user', content: userInput }],
      text: { format: zodTextFormat(schema, schemaName) },
    });
    if (response.output_parsed === null)
      throw new Error('OpenAI returned no structured output');

    return {
      output: response.output_parsed as T,
      usage: {
        ...(response.usage === undefined
          ? {}
          : {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
            }),
      },
    };
  }
}
