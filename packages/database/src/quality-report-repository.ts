import { qualityReportSchema, type QualityReport } from '@ai-web-agency/shared';
import { desc, eq } from 'drizzle-orm';
import type { Database } from './client.js';
import { qualityReports, type QualityReportRow } from './schema/index.js';
export class QualityReportRepository {
  constructor(private readonly database: Database) {}
  async start(
    websiteVersionId: string,
    agentJobId: string,
  ): Promise<QualityReportRow> {
    const [existing] = await this.database
      .select()
      .from(qualityReports)
      .where(eq(qualityReports.agentJobId, agentJobId));
    if (existing !== undefined) return existing;
    const [created] = await this.database
      .insert(qualityReports)
      .values({ websiteVersionId, agentJobId })
      .returning();
    if (created === undefined)
      throw new Error('Failed to create quality report');
    return created;
  }
  async complete(id: string, report: QualityReport): Promise<QualityReportRow> {
    const [updated] = await this.database
      .update(qualityReports)
      .set({
        status: 'COMPLETED',
        report: qualityReportSchema.parse(report),
        completedAt: new Date(),
      })
      .where(eq(qualityReports.id, id))
      .returning();
    if (updated === undefined) throw new Error('Quality report not found');
    return updated;
  }
  async fail(id: string): Promise<void> {
    await this.database
      .update(qualityReports)
      .set({ status: 'FAILED', completedAt: new Date() })
      .where(eq(qualityReports.id, id));
  }
  listForVersion(versionId: string): Promise<QualityReportRow[]> {
    return this.database
      .select()
      .from(qualityReports)
      .where(eq(qualityReports.websiteVersionId, versionId))
      .orderBy(desc(qualityReports.createdAt));
  }
}
