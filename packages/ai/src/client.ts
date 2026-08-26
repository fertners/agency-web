import {
  browserReviewReportSchema,
  designReviewResultSchema,
  restaurantBriefsSchema,
  restaurantBusinessDataSchema,
  restaurantWebsiteConfigSchema,
  websiteCorrectionPatchSchema,
  type DesignReviewResult,
  type RestaurantBriefs,
  type WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';

import type { AICallRecord, AIProvider, AIUsageRecorder } from './types.js';

const noOpRecorder: AIUsageRecorder = { record: () => Promise.resolve() };

export class AIClient {
  constructor(
    private readonly provider: AIProvider,
    private readonly recorder: AIUsageRecorder = noOpRecorder,
  ) {}

  get supportsVision(): boolean {
    return this.provider.supportsVision;
  }

  async generateRestaurantBrief(input: {
    business: unknown;
    jobId: string;
  }): Promise<RestaurantBriefs> {
    const business = restaurantBusinessDataSchema.parse(input.business);
    const startedAt = performance.now();
    const baseRecord = {
      jobId: input.jobId,
      provider: this.provider.name,
      model: this.provider.model,
      context: 'restaurant.website.brief',
      input: { business },
    } as const;

    try {
      const result = await this.provider.generateRestaurantBrief({
        business,
        jobId: input.jobId,
      });
      const output = restaurantBriefsSchema.parse(result.output);
      await this.record({
        ...baseRecord,
        output,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
        costMicros: result.usage?.costMicros ?? null,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        error: null,
      });
      return output;
    } catch (error) {
      await this.record({
        ...baseRecord,
        output: null,
        inputTokens: null,
        outputTokens: null,
        costMicros: null,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : 'AI call failed',
      });
      throw error;
    }
  }

  async reviewWebsiteDesign(input: {
    config: unknown;
    browserReport: unknown;
    screenshots?: readonly { mimeType: 'image/png'; base64: string }[];
    jobId: string;
  }): Promise<DesignReviewResult> {
    const config = restaurantWebsiteConfigSchema.parse(input.config);
    const browserReport = browserReviewReportSchema.parse(input.browserReport);
    return this.runStructured(
      'restaurant.website.design-review',
      input.jobId,
      { config, browserReport },
      designReviewResultSchema,
      () =>
        this.provider.reviewWebsiteDesign({
          config,
          browserReport,
          ...(input.screenshots === undefined
            ? {}
            : { screenshots: input.screenshots }),
          jobId: input.jobId,
        }),
    );
  }

  async proposeWebsiteCorrection(input: {
    config: unknown;
    review: unknown;
    jobId: string;
  }): Promise<WebsiteCorrectionPatch> {
    const config = restaurantWebsiteConfigSchema.parse(input.config);
    const review = designReviewResultSchema.parse(input.review);
    return this.runStructured(
      'restaurant.website.correction',
      input.jobId,
      { config, review },
      websiteCorrectionPatchSchema,
      () =>
        this.provider.proposeWebsiteCorrection({
          config,
          review,
          jobId: input.jobId,
        }),
    );
  }

  private async runStructured<T>(
    context: string,
    jobId: string,
    input: Record<string, unknown>,
    schema: { parse(value: unknown): T },
    call: () => Promise<{
      output: T;
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        costMicros?: number;
      };
    }>,
  ): Promise<T> {
    const startedAt = performance.now();
    const baseRecord = {
      jobId,
      provider: this.provider.name,
      model: this.provider.model,
      context,
      input,
    } as const;
    try {
      const providerResult = await call();
      const output = schema.parse(providerResult.output);
      await this.record({
        ...baseRecord,
        output: output as Record<string, unknown>,
        inputTokens: providerResult.usage?.inputTokens ?? null,
        outputTokens: providerResult.usage?.outputTokens ?? null,
        costMicros: providerResult.usage?.costMicros ?? null,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        error: null,
      });
      return output;
    } catch (error) {
      await this.record({
        ...baseRecord,
        output: null,
        inputTokens: null,
        outputTokens: null,
        costMicros: null,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : 'AI call failed',
      });
      throw error;
    }
  }

  private async record(record: AICallRecord): Promise<void> {
    try {
      await this.recorder.record(record);
    } catch {
      // Observability must not turn a valid provider result into a failed generation.
    }
  }
}
