# Project instructions

## Product scope

Build the AI Web Agency incrementally. Complete and verify the current roadmap phase before starting the next one. The first supported website vertical will be restaurants, but website generation is not part of Phase 1.

## Engineering principles

- Optimize for a single maintainer: prefer direct, readable modules over speculative abstractions.
- Keep HTTP controllers, business logic, persistence, queues, AI calls, and external integrations separated.
- Use strict TypeScript. Do not introduce `any` or trust unvalidated external data.
- Validate API, user, AI, and integration boundaries with Zod where appropriate.
- Keep long-running work out of HTTP requests and make background jobs idempotent.
- Never execute AI-generated code in the primary application process.
- Never commit secrets. Document every required variable in `.env.example`.
- Add only dependencies that solve a current requirement.

## Required verification

Before considering a change complete, run the relevant tests followed by:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Update documentation when behavior, setup, or architecture changes.
