import {
  designReviewResultSchema,
  restaurantBriefsSchema,
  websiteCorrectionPatchSchema,
  type DesignReviewResult,
  type RestaurantBriefs,
  type WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';
import { z } from 'zod';

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
  'Retourne uniquement un objet JSON conforme au schéma demandé.',
].join(' ');

const ollamaResponseSchema = z
  .object({
    message: z.object({ content: z.string() }),
    prompt_eval_count: z.number().int().nonnegative().optional(),
    eval_count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

type OllamaProviderOptions = Readonly<{
  baseUrl: string;
  model: string;
  fetchImplementation?: typeof fetch;
}>;

export class OllamaAIProvider implements AIProvider {
  readonly name = 'ollama';
  readonly model: string;
  readonly supportsVision = true;
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: OllamaProviderOptions) {
    this.model = options.model;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  generateRestaurantBrief(
    request: RestaurantBriefRequest,
  ): Promise<AIProviderResult<RestaurantBriefs>> {
    return this.runStructured(
      restaurantBriefsSchema,
      [
        BASE_INSTRUCTIONS,
        'Rédige le contenu concis d’un site de restaurant et une direction artistique.',
        'Les couleurs doivent être lisibles et cohérentes avec le profil de marque lorsqu’il existe.',
        'N’ajoute ni avis, ni menu, ni service, ni horaire absent des données.',
      ].join(' '),
      { business: request.business },
    );
  }

  reviewWebsiteDesign(
    request: DesignReviewRequest,
  ): Promise<AIProviderResult<DesignReviewResult>> {
    return this.runStructured(
      designReviewResultSchema,
      [
        BASE_INSTRUCTIONS,
        'Évalue la qualité visuelle et professionnelle du site à partir de sa configuration, du rapport navigateur et des captures.',
        'Toute erreur bloquante du navigateur doit rester bloquante.',
        'Le score doit être transparent et les corrections actionnables.',
      ].join(' '),
      { config: request.config, browserReport: request.browserReport },
      request.screenshots?.map((screenshot) => screenshot.base64),
    );
  }

  proposeWebsiteCorrection(
    request: WebsiteCorrectionRequest,
  ): Promise<AIProviderResult<WebsiteCorrectionPatch>> {
    return this.runStructured(
      websiteCorrectionPatchSchema,
      [
        BASE_INSTRUCTIONS,
        'Propose uniquement un patch de configuration sûr et minimal pour corriger les problèmes du rapport.',
        'Ne change aucun fait métier et ne fournis jamais de code exécutable.',
      ].join(' '),
      { config: request.config, review: request.review },
    );
  }

  private async runStructured<T>(
    schema: z.ZodType<T>,
    instructions: string,
    input: Record<string, unknown>,
    images?: readonly string[],
  ): Promise<AIProviderResult<T>> {
    const response = await this.fetchImplementation(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: z.toJSONSchema(schema),
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: instructions },
            {
              role: 'user',
              content: JSON.stringify(input),
              ...(images === undefined || images.length === 0
                ? {}
                : { images }),
            },
          ],
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Ollama request failed with HTTP ${response.status}`);

    const payload = ollamaResponseSchema.parse(await response.json());
    let decoded: unknown;
    try {
      decoded = JSON.parse(payload.message.content);
    } catch {
      throw new Error('Ollama returned invalid JSON');
    }

    return {
      output: schema.parse(decoded),
      usage: {
        inputTokens: payload.prompt_eval_count,
        outputTokens: payload.eval_count,
        costMicros: 0,
      },
    };
  }
}
