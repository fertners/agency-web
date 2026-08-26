# Phase 7 — Clients and local delivery

## Delivered scope

- idempotent conversion from an approved proposal to one client and one project;
- durable `CONVERTED` prospect transition;
- explicit attachment of an approved website version to a project;
- provider-independent `DeploymentService` contract;
- local preview provider with no cloud credentials or public publication;
- Cloudflare Pages Direct Upload provider for public preview and production
  URLs, with one isolated Pages project per Website;
- BullMQ deployment queue and independent worker;
- durable deployment status, active version, URL, failure, and rollback history;
- operator pages `/clients` and `/deployments`.
- production service-token authentication with `ADMIN` and restricted
  `OPERATOR` roles.

## Safety boundary

The local provider only activates the already isolated preview URL. Cloudflare
Pages can publish a validated static Website version when
`DEPLOYMENT_PROVIDER=cloudflare-pages` and the account credentials are supplied.
No automatic publication is performed. Custom domains and payment providers
still require explicit legal, billing, and secret-management decisions.

## Cloudflare Pages

Set the following only in the runtime environment (never in Git):

```dotenv
DEPLOYMENT_PROVIDER=cloudflare-pages
CLOUDFLARE_ACCOUNT_ID=<32-character account id>
CLOUDFLARE_API_TOKEN=<token with Pages Write>
CLOUDFLARE_PAGES_PROJECT_PREFIX=agency-site
```

The worker creates `PREFIX-<website-id>` when needed, deploys preview versions
on isolated branches, and deploys approved production versions on `main`.

## Acceptance workflow

1. Approve a Phase 6 proposal and convert its prospect.
2. Attach an `APPROVED` website version to the resulting project.
3. Start a preview deployment and let the deployment worker complete it.
4. Verify the active preview URL and durable agent job.
5. Deploy another approved version and rollback to the first completed deployment.

## Verification

```powershell
pnpm db:migrate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
