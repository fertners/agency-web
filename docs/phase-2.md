# Phase 2 acceptance record

## Delivered website engine

- strict restaurant business, content, design, and website configuration contracts;
- durable businesses, websites, immutable website versions, and AI call logs;
- controlled React website engine with a responsive restaurant template;
- isolated Next.js preview application on port 3002;
- asynchronous BullMQ generation worker with bounded retries and idempotent versions;
- provider-independent AI client with a local deterministic provider;
- dashboard workflow to submit restaurants, follow jobs, browse versions, preview, approve, and reject;
- versioned migrations and infrastructure-backed integration tests.

## Acceptance commands

```powershell
pnpm infra:up
pnpm db:migrate
pnpm check
pnpm db:test
pnpm api:test
pnpm generation:test
```

During `pnpm dev`, the operator workflow is available at `http://localhost:3000/websites` and generated previews at `http://localhost:3002/preview/:websiteId/:versionId`.

## Human review semantics

Approving a version keeps every previous version but guarantees that at most one version remains `APPROVED`: the previously approved version returns to `READY`. Rejecting a version marks only that immutable version as `REJECTED`; it is still previewable for comparison.

## Intentionally deferred

Cloud LLM adapters, Playwright screenshots, visual criticism, automatic corrections, SEO scoring, and technical QA belong to Phases 3 and 4. The local provider keeps Phase 2 fully runnable without paid credentials.
