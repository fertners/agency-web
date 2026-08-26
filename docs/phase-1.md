# Phase 1 acceptance record

## Delivered foundation

- pnpm and Turborepo monorepo with strict TypeScript;
- Next.js administration dashboard with Tailwind CSS and reusable UI components;
- modular NestJS API with validated health and diagnostic-job endpoints;
- PostgreSQL persistence through Drizzle ORM and a versioned migration;
- Redis and BullMQ queue with an independently runnable foundation worker;
- bounded retries, durable job statuses, and sanitized failures;
- Docker Compose development infrastructure with healthchecks and persistent volumes;
- shared Zod contracts used across HTTP and queue boundaries;
- unit and infrastructure-backed integration tests;
- local setup, architecture, and operating documentation.

## Acceptance commands

With PostgreSQL and Redis running through `pnpm infra:up`:

```powershell
pnpm db:migrate
pnpm check
pnpm db:test
pnpm api:test
pnpm workflow:test
```

The phase is accepted only when every command succeeds and the dashboard is reachable at `http://localhost:3000` during `pnpm dev`.

## Intentionally deferred

Website schemas, restaurant templates, AI providers, generated previews, Playwright, design review, SEO, QA, prospect research, commercial workflows, and production deployment belong to later roadmap phases.
