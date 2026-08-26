# AI Web Agency

Monorepo for an AI-assisted web agency platform. The product is developed incrementally, beginning with the local application and job-processing foundation.

## Requirements

- Node.js 22.18.x (reference) or Node.js 24.x
- pnpm 11.x

## Commands

```powershell
pnpm install
Copy-Item .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Open the dashboard at `http://localhost:3000`. The API and its health endpoint are available at `http://localhost:3001` and `http://localhost:3001/health`.

PostgreSQL and Redis run locally in Docker. Run the complete verification suite with `pnpm check`; infrastructure-backed tests are documented separately.

Phases 1 through 4 are available locally. See the [Phase 1 acceptance record](docs/phase-1.md), [Phase 2 acceptance record](docs/phase-2.md), [Phase 3 acceptance record](docs/phase-3.md), [Phase 4 acceptance record](docs/phase-4.md), [development documentation](docs/development.md), and [architecture documentation](docs/architecture.md).
