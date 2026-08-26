import { AIClient, LocalAIProvider } from '@ai-web-agency/ai';
import type { PlaywrightWebsiteReviewer } from '@ai-web-agency/browser';
import type { DesignReview, WebsiteVersion } from '@ai-web-agency/database';
import {
  browserReviewReportSchema,
  restaurantWebsiteConfigSchema,
  type DesignReviewJobPayload,
  type DesignReviewJobResult,
} from '@ai-web-agency/shared';
import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { createDesignReviewProcessor } from '../../src/processor.js';

const config = restaurantWebsiteConfigSchema.parse({
  schemaVersion: 1,
  business: {
    kind: 'RESTAURANT',
    name: 'Review Test',
    slug: 'review-test',
    description: 'Description',
    cuisines: ['French'],
    address: {
      street: '1 rue Test',
      postalCode: '33000',
      city: 'Bordeaux',
      countryCode: 'FR',
    },
    contact: { email: 'test@example.com' },
    openingHours: [],
    services: [],
    menuHighlights: [],
  },
  content: {
    headline: 'Headline',
    subheadline: 'Subheadline',
    about: 'About',
    primaryCallToAction: 'Contact',
    specialtiesHeading: 'Menu',
    seoTitle: 'Review Test',
    seoDescription: 'Review Test description',
  },
  design: {
    tone: 'ELEGANT',
    primaryColor: '#111111',
    accentColor: '#222222',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    styleKeywords: ['clean'],
  },
  sections: ['HERO', 'CONTACT'],
  generatedAt: new Date(0).toISOString(),
});
const websiteId = crypto.randomUUID();
const initialVersionId = crypto.randomUUID();
const jobId = crypto.randomUUID();

describe('design review processor', () => {
  it('creates at most two corrected versions and stops after iteration three', async () => {
    const versionIds: string[] = [
      initialVersionId,
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    const findVersion = vi.fn(
      (_websiteId: string, versionId: string): Promise<WebsiteVersion> =>
        Promise.resolve({
          id: versionId,
          websiteId,
          agentJobId: null,
          version: versionIds.indexOf(versionId) + 1,
          status: 'READY',
          config,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );
    const createVersion = vi.fn((): Promise<WebsiteVersion> => {
      const id = versionIds[createVersion.mock.calls.length] ?? versionIds[2]!;
      return Promise.resolve({
        id,
        websiteId,
        agentJobId: null,
        version: createVersion.mock.calls.length + 1,
        status: 'READY',
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    const start = vi.fn(
      ({
        websiteVersionId,
        iteration,
      }: {
        websiteVersionId: string;
        agentJobId: string;
        iteration: number;
      }): Promise<DesignReview> =>
        Promise.resolve({
          id: crypto.randomUUID(),
          websiteVersionId,
          correctedVersionId: null,
          agentJobId: jobId,
          iteration,
          status: 'RUNNING',
          browserReport: null,
          result: null,
          createdAt: new Date(),
          completedAt: null,
        }),
    );
    const complete = vi.fn((): Promise<DesignReview> =>
      Promise.resolve({
        id: crypto.randomUUID(),
        websiteVersionId: initialVersionId,
        correctedVersionId: null,
        agentJobId: jobId,
        iteration: 1,
        status: 'COMPLETED',
        browserReport: null,
        result: null,
        createdAt: new Date(),
        completedAt: new Date(),
      }),
    );
    const browserReport = browserReviewReportSchema.parse({
      url: `http://localhost:3002/preview/${websiteId}/${initialVersionId}`,
      statusCode: 200,
      title: 'Test',
      javascriptErrors: ['boom'],
      failedRequests: [],
      linksChecked: 1,
      formsChecked: 0,
      hasHorizontalOverflow: false,
      issues: [
        {
          code: 'JAVASCRIPT_ERROR',
          severity: 'BLOCKING',
          message: 'JavaScript error',
        },
      ],
      screenshots: [
        {
          kind: 'DESKTOP_SCREENSHOT',
          path: 'desktop.png',
          mimeType: 'image/png',
          width: 1440,
          height: 1000,
        },
        {
          kind: 'MOBILE_SCREENSHOT',
          path: 'mobile.png',
          mimeType: 'image/png',
          width: 390,
          height: 844,
        },
      ],
    });
    const reviewer = {
      review: vi.fn().mockResolvedValue(browserReport),
    } as unknown as PlaywrightWebsiteReviewer;
    const agentJobs = {
      markRunning: vi.fn(),
      markCompleted: vi.fn(),
      markPendingRetry: vi.fn(),
      markFailed: vi.fn(),
    };
    const processor = createDesignReviewProcessor(
      {
        agentJobs,
        websites: { findVersion, createVersion },
        designReviews: { start, complete, fail: vi.fn() },
      },
      new AIClient(new LocalAIProvider()),
      reviewer,
      { previewBaseUrl: 'http://localhost:3002', artifactsRoot: 'artifacts' },
    );
    const job = {
      id: jobId,
      data: { websiteId, versionId: initialVersionId, iteration: 1 },
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as unknown as Job<DesignReviewJobPayload, DesignReviewJobResult>;
    const result = await processor(job);
    expect(result).toMatchObject({ iteration: 3, passed: false });
    expect(createVersion).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenCalledTimes(3);
    expect(complete).toHaveBeenCalledTimes(3);
  });
});
