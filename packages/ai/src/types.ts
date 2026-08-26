import type {
  BrowserReviewReport,
  DesignReviewResult,
  RestaurantBriefs,
  RestaurantBusinessData,
  RestaurantWebsiteConfig,
  WebsiteCorrectionPatch,
} from '@ai-web-agency/shared';

export type AIUsage = Readonly<{
  inputTokens?: number;
  outputTokens?: number;
  costMicros?: number;
}>;
export type RestaurantBriefRequest = Readonly<{
  business: RestaurantBusinessData;
  jobId: string;
}>;
export type AIProviderResult<T> = Readonly<{ output: T; usage?: AIUsage }>;
export type DesignReviewRequest = Readonly<{
  config: RestaurantWebsiteConfig;
  browserReport: BrowserReviewReport;
  jobId: string;
}>;
export type WebsiteCorrectionRequest = Readonly<{
  config: RestaurantWebsiteConfig;
  review: DesignReviewResult;
  jobId: string;
}>;

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateRestaurantBrief(
    request: RestaurantBriefRequest,
  ): Promise<AIProviderResult<RestaurantBriefs>>;
  reviewWebsiteDesign(
    request: DesignReviewRequest,
  ): Promise<AIProviderResult<DesignReviewResult>>;
  proposeWebsiteCorrection(
    request: WebsiteCorrectionRequest,
  ): Promise<AIProviderResult<WebsiteCorrectionPatch>>;
}

export type AICallRecord = Readonly<{
  jobId: string;
  provider: string;
  model: string;
  context: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costMicros: number | null;
  durationMs: number;
  error: string | null;
}>;
export interface AIUsageRecorder {
  record(record: AICallRecord): Promise<void>;
}
