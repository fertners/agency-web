import {
  browserReviewReportSchema,
  type BrowserReviewReport,
} from '@ai-web-agency/shared';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices, type BrowserContext, type Page } from 'playwright';

export type WebsiteReviewRequest = Readonly<{
  url: string;
  websiteId: string;
  versionId: string;
  artifactsRoot: string;
}>;

function assertAllowedPreviewUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '3002' ||
    !url.pathname.startsWith('/preview/')
  )
    throw new Error('Only local preview URLs are allowed');
  return url;
}

async function stabilize(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll(async (images) =>
    Promise.all(
      images.map(async (image) => {
        if (image instanceof HTMLImageElement && image.complete) return;
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }),
    ),
  );
}

export class PlaywrightWebsiteReviewer {
  async review(request: WebsiteReviewRequest): Promise<BrowserReviewReport> {
    const url = assertAllowedPreviewUrl(request.url);
    const directory = path.resolve(
      request.artifactsRoot,
      'websites',
      request.websiteId,
      request.versionId,
    );
    await mkdir(directory, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const javascriptErrors: string[] = [];
    const failedRequests: string[] = [];
    try {
      const desktop = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const desktopResult = await this.capture(
        desktop,
        url,
        path.join(directory, 'desktop.png'),
        javascriptErrors,
        failedRequests,
      );
      await desktop.close();
      const mobile = await browser.newContext({ ...devices['iPhone 13'] });
      const mobileResult = await this.capture(
        mobile,
        url,
        path.join(directory, 'mobile.png'),
        javascriptErrors,
        failedRequests,
      );
      await mobile.close();
      return browserReviewReportSchema.parse({
        url: url.toString(),
        statusCode: desktopResult.statusCode,
        title: desktopResult.title,
        javascriptErrors,
        failedRequests,
        linksChecked: desktopResult.links,
        formsChecked: desktopResult.forms,
        hasHorizontalOverflow: mobileResult.overflow,
        issues: [
          ...(javascriptErrors.length === 0
            ? []
            : [
                {
                  code: 'JAVASCRIPT_ERROR',
                  severity: 'BLOCKING' as const,
                  message: `${javascriptErrors.length} JavaScript error(s) detected`,
                },
              ]),
          ...(failedRequests.length === 0
            ? []
            : [
                {
                  code: 'FAILED_REQUEST',
                  severity: 'HIGH' as const,
                  message: `${failedRequests.length} request(s) failed`,
                },
              ]),
          ...(mobileResult.overflow
            ? [
                {
                  code: 'HORIZONTAL_OVERFLOW',
                  severity: 'HIGH' as const,
                  message: 'The mobile preview has horizontal overflow',
                  viewport: 'MOBILE' as const,
                },
              ]
            : []),
        ],
        screenshots: [
          {
            kind: 'DESKTOP_SCREENSHOT',
            path: path.relative(
              request.artifactsRoot,
              path.join(directory, 'desktop.png'),
            ),
            mimeType: 'image/png',
            width: 1440,
            height: 1000,
          },
          {
            kind: 'MOBILE_SCREENSHOT',
            path: path.relative(
              request.artifactsRoot,
              path.join(directory, 'mobile.png'),
            ),
            mimeType: 'image/png',
            width: 390,
            height: 844,
          },
        ],
      });
    } finally {
      await browser.close();
    }
  }

  private async capture(
    context: BrowserContext,
    url: URL,
    outputPath: string,
    javascriptErrors: string[],
    failedRequests: string[],
  ) {
    const page = await context.newPage();
    page.on('pageerror', (error) =>
      javascriptErrors.push(error.message.slice(0, 500)),
    );
    page.on('requestfailed', (request) =>
      failedRequests.push(`${request.method()} ${request.url()}`.slice(0, 500)),
    );
    const response = await page.goto(url.toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    if (response === null) throw new Error('Preview returned no response');
    await stabilize(page);
    const result = await page.evaluate(() => ({
      title: document.title,
      links: document.querySelectorAll('a[href]').length,
      forms: document.querySelectorAll('form').length,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }));
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      animations: 'disabled',
    });
    return { statusCode: response.status(), ...result };
  }
}
