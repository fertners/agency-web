# Phase 3 acceptance record

## Delivered design review workflow

- isolated `@ai-web-agency/browser` package backed by headless Playwright Chromium;
- deterministic desktop (1440×1000) and mobile (iPhone 13) full-page screenshots;
- JavaScript errors, failed requests, links, forms, HTTP status, title, and horizontal overflow collection;
- local artifact storage under the ignored `artifacts/` directory with controlled API download routes;
- durable and idempotent design review records linked to jobs and immutable website versions;
- structured ten-category critic result, score out of 100, severity-ranked issues, and summary;
- provider-independent design critic and correction methods on `AIProvider` with full AI call logging;
- correction patches limited to validated content, design tokens, and section ordering;
- at most three review iterations and at most two automatically corrected versions;
- dashboard controls to start reviews, inspect scores, and open desktop/mobile captures.

## Acceptance thresholds

A version passes automated design review when its score is at least 80 and it has no blocking issue. Passing automation never replaces human approval. If the threshold is not reached, the worker creates and reviews a new immutable version. At iteration three it stops and returns the last report for human intervention.

## Local critic

The default local provider is deterministic and free: it converts browser evidence into the same validated critic contract used by a future multimodal provider. It does not claim subjective pixel-level aesthetic judgement. A cloud vision adapter can be added later without changing the queue, database, API, correction loop, or dashboard.

## Setup and verification

```powershell
pnpm install
pnpm --filter @ai-web-agency/browser exec playwright install chromium
pnpm infra:up
pnpm db:migrate
pnpm dev
pnpm check
```

Open `http://localhost:3000/websites`, select **Analyser** on a generated version, refresh after the job completes, then open the desktop or mobile capture.

## Intentionally deferred

SEO, structured data, technical QA scoring, accessibility auditing, and performance budgets belong to Phase 4. A paid multimodal provider is optional and requires an explicit provider implementation and credentials.
