# Phase 7 — Clients and local delivery

## Delivered scope

- idempotent conversion from an approved proposal to one client and one project;
- durable `CONVERTED` prospect transition;
- explicit attachment of an approved website version to a project;
- provider-independent `DeploymentService` contract;
- local preview provider with no cloud credentials or public publication;
- BullMQ deployment queue and independent worker;
- durable deployment status, active version, URL, failure, and rollback history;
- operator pages `/clients` and `/deployments`.

## Safety boundary

The local provider only activates the already isolated preview URL. `PRODUCTION` is represented in the contract for forward compatibility but no public cloud provider, custom domain, payment provider, or automatic production mutation is configured. These require explicit provider, legal, billing, and secret-management decisions.

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
