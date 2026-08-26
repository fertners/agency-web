# Phase 6 — Commercial workflow

## Delivered scope

- qualification lifecycle from `NEW` through `CONVERTED` or `DISMISSED`;
- durable status history and internal prospect notes;
- immutable, versioned commercial proposals with price, currency, timeline, and scope;
- explicit proposal approval and rejection;
- one conversation per prospect with structured email, phone-note, or manual drafts;
- explicit draft approval and rejection;
- operator pages for prospect detail, proposals, and conversations;
- no email provider, send endpoint, or `SENT` status.

## Safety boundary

Phase 6 prepares commercial material but never contacts a prospect. An approved draft remains an internal artifact. Adding delivery requires a separate decision covering the provider, applicable law, rate limits, suppression lists, opt-out handling, and action-time human confirmation.

## Acceptance workflow

1. Open `/prospects` and select a real OpenStreetMap prospect.
2. Qualify it and record an internal note.
3. Create a proposal, then approve or reject it from `/proposals`.
4. Generate an email draft, then approve or reject it from `/conversations`.
5. Confirm that no action sends a message or calls an email provider.

## Verification

```powershell
pnpm db:migrate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
