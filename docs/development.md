# Local development

## Prerequisites

- Node.js 22.18.x (reference) or Node.js 24.x
- pnpm 11.x
- Git
- Docker Desktop with Docker Compose

## Install

```bash
pnpm install
Copy-Item .env.example .env # PowerShell
pnpm infra:up
pnpm db:migrate
pnpm build
pnpm start
```

On macOS or Linux, replace the copy command with `cp .env.example .env`.

Use `pnpm dev` when watch mode is required. `pnpm start` runs the applications and workers from validated production builds and is the preferred fallback on Windows if `tsx` reports `uv_os_get_passwd/ENOMEM`.

`pnpm infra:up` waits until PostgreSQL and Redis pass their healthchecks. Both ports are bound to `127.0.0.1` and are not exposed on the local network.

## Infrastructure

```bash
pnpm infra:status
pnpm infra:logs
pnpm infra:down
```

The named volumes `ai-web-agency_postgres_data` and `ai-web-agency_redis_data` preserve local data when containers are stopped or recreated. `docker compose down --volumes` deletes both volumes and all local database and queue data; use it only when an intentional reset is required.

Default development endpoints:

- Dashboard: `http://localhost:3000`
- API: `http://localhost:3001`
- Preview application: `http://localhost:3002`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Change host ports in `.env` if either default port is already occupied. The credentials in `.env.example` are development-only and must never be reused outside the local environment.

## Quality checks

```bash
pnpm check
```

Individual checks are available as `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

Database integration tests require healthy local infrastructure and run separately:

```bash
pnpm db:test
pnpm api:test
pnpm workflow:test
pnpm generation:test
```

`pnpm check` covers deterministic checks that do not require live infrastructure. Run all four integration commands after `pnpm infra:up` when validating a release or an infrastructure-related change. Stop other workers first so they cannot consume jobs created by the integration tests.

## Optional providers

With no `AI_PROVIDER`, the deterministic local provider is used. For Ollama, install it, run `ollama pull gemma3:4b`, then set `AI_PROVIDER=ollama`. OpenAI requires `AI_PROVIDER=openai` and `OPENAI_API_KEY`.

Local preview deployment is the default. Cloudflare Pages requires `DEPLOYMENT_PROVIDER=cloudflare-pages`, an account identifier, and a token restricted to Pages Write. Keep every secret outside Git and see the operations runbook for validation and rollback procedures.

## First diagnostic

After `pnpm dev` starts the dashboard, API, and foundation worker, open `http://localhost:3000` and select **Lancer un diagnostic**. The API creates a durable `PENDING` record, BullMQ dispatches it, and the worker updates it to a terminal status. Refresh the dashboard to inspect the result.

## Restaurant generation

Open `http://localhost:3000/websites`, enter a restaurant, and submit the form. Refresh once the generation worker completes. Every generated version can be opened on the preview application and explicitly approved or rejected without deleting older versions.

## Design review workflow

Install the local Chromium runtime once:

```powershell
pnpm --filter @ai-web-agency/browser exec playwright install chromium
```

From `/websites`, use **Analyser** on a generated version. The design-review worker stores desktop and mobile captures under `ARTIFACTS_ROOT` (the repository `artifacts/` directory by default), persists the structured score, and applies at most two controlled corrections across three total iterations.

## Database migrations

The TypeScript schema in `packages/database/src/schema` is the source of truth. Generate and review a SQL migration before applying it:

```bash
pnpm db:generate
pnpm db:check
pnpm db:migrate
```

Never use `drizzle-kit push` for shared or production databases. Migrations in `packages/database/migrations` must be committed.

## Workspace layout

- `apps/*`: user-facing and HTTP applications;
- `packages/*`: reusable capabilities and contracts;
- `workers/*`: independently runnable job consumers;
- `docs/*`: concise architecture and development documentation.
