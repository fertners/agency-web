# AI Web Agency

Monorepo for an AI-assisted web agency platform. Phases 1 through 7 cover the local platform, restaurant websites, automated review and QA, prospect research, commercial workflows, client conversion, and traceable deployment.

## Requirements

- Node.js 22.18.x (reference) or Node.js 24.x
- pnpm 11.x

## Commands

```powershell
pnpm install
Copy-Item .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm build
pnpm start
```

`pnpm dev` enables watch mode. On Windows hosts affected by Node's `uv_os_get_passwd/ENOMEM` issue, use the compiled `pnpm start` workflow above.

Open the dashboard at `http://localhost:3000`. The API and its health endpoint are available at `http://localhost:3001` and `http://localhost:3001/health`.

PostgreSQL and Redis run locally in Docker. Run the complete verification suite with `pnpm check`; infrastructure-backed tests are documented separately.

Phases 1 through 7 are available locally. Acceptance records live in `docs/phase-1.md` through `docs/phase-7.md`. See also the [development documentation](docs/development.md), [operations runbook](docs/operations-runbook.md), and [architecture documentation](docs/architecture.md).
