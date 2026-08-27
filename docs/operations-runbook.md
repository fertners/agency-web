# Operations runbook

## Runtime environments

- Development: copy `.env.example` to `.env`, keep `NODE_ENV=development`, and use local PostgreSQL and Redis.
- Test: use a disposable database and Redis database or instance. Never point integration tests at production.
- Production: set `NODE_ENV=production`, unique database credentials, `ADMIN_API_TOKEN`, `INTERNAL_API_TOKEN`, and optionally a restricted `OPERATOR_API_TOKEN` in the runtime secret store.

The application defaults to deterministic local AI and local preview deployment when optional providers are not explicitly configured.

## Release validation

```powershell
pnpm infra:up
pnpm db:migrate
pnpm check
pnpm db:test
pnpm api:test
pnpm workflow:test
pnpm generation:test
pnpm start
```

Confirm `/health`, the dashboard, preview, all seven workers, one complete prospect workflow, a local deployment, and a rollback.

## PostgreSQL backup

Create the destination directory, then stream a custom-format dump from the PostgreSQL container:

```powershell
New-Item -ItemType Directory -Force backups
docker compose exec -T postgres pg_dump -U agency -d ai_web_agency -Fc > backups/ai_web_agency.dump
```

Test restoration only into a disposable database:

```powershell
docker compose exec -T postgres createdb -U agency ai_web_agency_restore_test
Get-Content -AsByteStream backups/ai_web_agency.dump | docker compose exec -T postgres pg_restore -U agency -d ai_web_agency_restore_test --clean --if-exists
docker compose exec -T postgres psql -U agency -d ai_web_agency_restore_test -c "select 1"
```

Deleting the restore-test database is an explicit destructive action and must be done only after verifying its exact name.

## Logs and failures

HTTP logs are emitted by NestJS. Worker terminal states, sanitized errors, AI usage, and job logs are persisted and available from Agent Jobs. Infrastructure logs come from `pnpm infra:logs`. A production host should forward stdout and stderr to its log collector and alert on failed jobs, unhealthy dependencies, and repeated retries.

## Optional providers

- Ollama: `ollama pull gemma3:4b`, set `AI_PROVIDER=ollama`, and verify a structured generation before enabling it for workers.
- Cloudflare Pages: use a token restricted to Pages Write, validate preview first, then production and rollback. Custom domains remain separate.
- Overpass: keep `BUSINESS_SEARCH_USER_AGENT` set to an operator-controlled contact before real use; the example configuration uses `nefertitighislainedadjo@gmail.com`.

No automated email, payment, or custom-domain operation is enabled. Those features require provider selection, legal review, rate limits, unsubscribe handling, secret management, and action-time human confirmation.
