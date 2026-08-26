import { AxeBuilder } from '@axe-core/playwright';
import {
  accessibilityAuditSchema,
  performanceAuditSchema,
  type AccessibilityAudit,
  type PerformanceAudit,
  type QualityIssue,
} from '@ai-web-agency/shared';
import { chromium } from 'playwright';

function allowed(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '3002' ||
    !url.pathname.startsWith('/preview/')
  )
    throw new Error('Only local preview URLs are allowed');
  return url;
}
export class PlaywrightQualityAuditor {
  async audit(rawUrl: string): Promise<{
    accessibility: AccessibilityAudit;
    performance: PerformanceAudit;
  }> {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      const startedAt = Date.now();
      const response = await page.goto(allowed(rawUrl).toString(), {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });
      if (response === null || !response.ok())
        throw new Error('Preview is unavailable');
      const loadTimeMs = Date.now() - startedAt;
      const axe = await new AxeBuilder({ page }).analyze();
      const accessibilityIssues: QualityIssue[] = axe.violations.map(
        (violation) => ({
          code: `A11Y_${violation.id.toUpperCase().replaceAll('-', '_')}`,
          severity:
            violation.impact === 'critical'
              ? 'BLOCKING'
              : violation.impact === 'serious'
                ? 'ERROR'
                : 'WARNING',
          message: violation.help,
          suggestion: violation.helpUrl,
          target: violation.nodes[0]?.target.join(' '),
        }),
      );
      const metrics = await page.evaluate(() => ({
        resources: performance.getEntriesByType('resource').map((entry) => ({
          transferSize:
            'transferSize' in entry ? Number(entry.transferSize) : 0,
        })),
        dom: (
          performance.getEntriesByType('navigation')[0]?.toJSON() as
            { domContentLoadedEventEnd?: number } | undefined
        )?.domContentLoadedEventEnd,
      }));
      const transferBytes = metrics.resources.reduce(
        (sum, entry) => sum + entry.transferSize,
        0,
      );
      const performanceIssues: QualityIssue[] =
        loadTimeMs > 3_000
          ? [
              {
                code: 'PERF_LOAD_TIME',
                severity: 'WARNING',
                message: 'Le chargement dépasse trois secondes.',
                suggestion: 'Réduire les ressources et le travail bloquant.',
              },
            ]
          : [];
      return {
        accessibility: accessibilityAuditSchema.parse({
          score: Math.max(
            0,
            100 -
              accessibilityIssues.reduce(
                (sum, issue) =>
                  sum +
                  (issue.severity === 'BLOCKING'
                    ? 25
                    : issue.severity === 'ERROR'
                      ? 15
                      : 5),
                0,
              ),
          ),
          violations: axe.violations.length,
          issues: accessibilityIssues,
        }),
        performance: performanceAuditSchema.parse({
          score: Math.max(0, 100 - performanceIssues.length * 15),
          loadTimeMs,
          domContentLoadedMs: Math.round(metrics.dom ?? loadTimeMs),
          resourceCount: metrics.resources.length,
          transferBytes,
          issues: performanceIssues,
        }),
      };
    } finally {
      await browser.close();
    }
  }
}
