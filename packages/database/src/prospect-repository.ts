import {
  companyCandidateSchema,
  opportunityAssessmentSchema,
  type CompanyCandidate,
  type OpportunityAssessment,
} from '@ai-web-agency/shared';
import { desc, eq } from 'drizzle-orm';
import type { Database } from './client.js';
import { companies, prospects } from './schema/index.js';

export class ProspectRepository {
  constructor(private readonly database: Database) {}
  async upsert(
    candidateInput: CompanyCandidate,
    fingerprint: string,
    assessmentInput: OpportunityAssessment,
  ): Promise<{ created: boolean }> {
    const candidate = companyCandidateSchema.parse(candidateInput);
    const assessment = opportunityAssessmentSchema.parse(assessmentInput);
    const [existing] = await this.database
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.fingerprint, fingerprint));
    const [company] = await this.database
      .insert(companies)
      .values({
        fingerprint,
        source: candidate.source,
        externalId: candidate.externalId,
        name: candidate.name,
        category: candidate.category,
        countryCode: candidate.countryCode,
        city: candidate.city,
        street: candidate.street,
        postalCode: candidate.postalCode,
        websiteUrl: candidate.websiteUrl,
        email: candidate.email,
        phone: candidate.phone,
        raw: candidate,
      })
      .onConflictDoUpdate({
        target: companies.fingerprint,
        set: {
          source: candidate.source,
          externalId: candidate.externalId,
          name: candidate.name,
          category: candidate.category,
          countryCode: candidate.countryCode,
          city: candidate.city,
          street: candidate.street,
          postalCode: candidate.postalCode,
          websiteUrl: candidate.websiteUrl,
          email: candidate.email,
          phone: candidate.phone,
          raw: candidate,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!company) throw new Error('Failed to persist company');
    await this.database
      .insert(prospects)
      .values({
        companyId: company.id,
        opportunityScore: assessment.score,
        assessment,
      })
      .onConflictDoUpdate({
        target: prospects.companyId,
        set: {
          opportunityScore: assessment.score,
          assessment,
          updatedAt: new Date(),
        },
      });
    return { created: existing === undefined };
  }
  listRecent(limit = 50) {
    return this.database
      .select({ prospect: prospects, company: companies })
      .from(prospects)
      .innerJoin(companies, eq(prospects.companyId, companies.id))
      .orderBy(desc(prospects.opportunityScore), desc(prospects.updatedAt))
      .limit(limit);
  }
}
