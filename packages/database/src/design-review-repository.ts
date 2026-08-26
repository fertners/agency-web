import {
  browserReviewReportSchema,
  designReviewResultSchema,
  type BrowserReviewReport,
  type DesignReviewResult,
} from '@ai-web-agency/shared';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from './client.js';
import { designReviews, type DesignReview } from './schema/index.js';

export class DesignReviewRepository {
  constructor(private readonly database: Database) {}
  async start(input: {
    websiteVersionId: string;
    agentJobId: string;
    iteration: number;
  }): Promise<DesignReview> {
    const [existing] = await this.database
      .select()
      .from(designReviews)
      .where(
        and(
          eq(designReviews.websiteVersionId, input.websiteVersionId),
          eq(designReviews.iteration, input.iteration),
        ),
      );
    if (existing !== undefined) return existing;
    const [created] = await this.database
      .insert(designReviews)
      .values(input)
      .returning();
    if (created === undefined)
      throw new Error('Failed to create design review');
    return created;
  }
  async complete(
    id: string,
    browserReport: BrowserReviewReport,
    result: DesignReviewResult,
    correctedVersionId?: string,
  ): Promise<DesignReview> {
    const [updated] = await this.database
      .update(designReviews)
      .set({
        status: 'COMPLETED',
        browserReport: browserReviewReportSchema.parse(browserReport),
        result: designReviewResultSchema.parse(result),
        correctedVersionId,
        completedAt: new Date(),
      })
      .where(eq(designReviews.id, id))
      .returning();
    if (updated === undefined) throw new Error('Design review not found');
    return updated;
  }
  async fail(id: string): Promise<void> {
    await this.database
      .update(designReviews)
      .set({ status: 'FAILED', completedAt: new Date() })
      .where(eq(designReviews.id, id));
  }
  listForVersion(versionId: string): Promise<DesignReview[]> {
    return this.database
      .select()
      .from(designReviews)
      .where(eq(designReviews.websiteVersionId, versionId))
      .orderBy(desc(designReviews.createdAt));
  }
  async findById(id: string): Promise<DesignReview | undefined> {
    const [review] = await this.database
      .select()
      .from(designReviews)
      .where(eq(designReviews.id, id));
    return review;
  }
}
