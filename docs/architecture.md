# Architecture

## Direction

The platform is a TypeScript monorepo managed with pnpm and Turborepo. It follows a modular-monolith approach split into independently runnable processes:

- a Next.js administration dashboard;
- a NestJS business API;
- BullMQ workers for long-running operations;
- PostgreSQL as the durable source of truth;
- Redis as queue infrastructure.

Shared workspace packages are created only when at least one current application needs them. Future domain folders are not scaffolded in advance.

## Dependency boundaries

- The dashboard consumes API contracts and does not contain business persistence logic.
- The API coordinates domain operations and enqueues long-running work.
- Workers consume validated job payloads and persist durable outcomes.
- Shared packages must not depend on applications or workers.
- Queue state is technical state; durable business job state belongs in PostgreSQL.

## Current status

The repository foundation and local infrastructure exist. Docker Compose provides PostgreSQL 18 and Redis 8 with persistent named volumes and healthchecks. `@ai-web-agency/shared` owns the runtime-validated health and diagnostic-job contracts used across process boundaries. `@ai-web-agency/database` owns the Drizzle schema, versioned migrations, and explicit PostgreSQL client lifecycle. Its first durable entity is `agent_jobs`; future domain tables are deferred until needed.

The NestJS API owns HTTP orchestration. Its first module exposes `GET /health`, performs bounded PostgreSQL and Redis checks in parallel, validates the response against the shared contract, and returns HTTP 503 with sanitized details when a dependency is unavailable.

Diagnostic work follows `API → PostgreSQL PENDING record → BullMQ → foundation worker → PostgreSQL terminal state`. BullMQ retries are limited to three attempts with exponential backoff. PostgreSQL stores the durable business state while Redis stores technical queue state; errors persisted for operators are sanitized.

The Next.js dashboard is a server-rendered operations client. It reads validated contracts from NestJS and uses a server action only as a thin HTTP adapter for diagnostic-job creation; it contains no persistence or queue logic.

## Website engine

Restaurant generation stores structured business data, then dispatches a `website.generate.restaurant` job to the generation worker. The worker obtains content and design briefs through `AIClient`, validates them, assembles a controlled `RestaurantWebsiteConfig`, and persists an immutable version. A unique job reference makes version creation idempotent across BullMQ retries.

`@ai-web-agency/websites` owns the React template and design tokens. AI providers can influence validated content and design fields but cannot generate or execute arbitrary application code. The separate preview application reads versions through NestJS and renders them on port 3002 with `noindex` metadata.

Human review changes only version status. Approving a version preserves its predecessors and demotes any former approval to `READY`; rejecting a version keeps it previewable. Phase 3 automation must consume these same immutable versions instead of overwriting them.

## Design review

Design reviews follow `API → durable agent job → BullMQ → design-review worker → Playwright → AIClient → database`. The browser package accepts only local port-3002 preview URLs, stabilizes fonts and images, captures desktop and mobile, and records deterministic browser evidence. Screenshots live below the ignored repository `artifacts/` directory and are exposed only through review-scoped API routes.

The critic returns a validated score and category report. A score below 80 or a blocking issue triggers a validated configuration patch and a new immutable website version. The same job may perform at most three review iterations, producing at most two corrected versions. Human approval remains independent from the automated result.

## SEO and quality assurance

Quality follows `API → durable job → BullMQ → quality worker → deterministic SEO + Playwright/axe → quality_reports`. SEO, accessibility, performance, and the global score have independent thresholds so one strong category cannot conceal a critical weakness. Preview metadata remains `noindex`, while canonical, Open Graph, and Restaurant JSON-LD model the production SEO output. Automated passage never approves a website version on behalf of the operator.

## Prospect research and commercial workflow

Prospect research persists public OpenStreetMap/Overpass company data separately from website-generation businesses. Phase 6 adds an operator-controlled CRM layer: status transitions and notes are durable, proposals are immutable versions, and communication artifacts are drafts only. The API exposes no delivery operation and the database intentionally has no `SENT` state. Approval means that an internal artifact is ready for a later human-controlled delivery workflow; it never contacts a prospect.

## Client conversion and delivery

An approved proposal can be converted transactionally into one client and one project. The prospect remains the commercial source of truth and receives a durable `CONVERTED` transition. Projects reference only an explicitly approved website version. Deployments follow `API → agent job → BullMQ → deployment worker → DeploymentService → database`. The first provider is local and returns the isolated preview URL; it does not publish to the Internet or require credentials. Every activation is durable and rollback creates a new audit row rather than deleting history.
