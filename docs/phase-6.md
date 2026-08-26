# Phase 6 — Commercial workflow

## Delivered scope

- qualification lifecycle from `NEW` through `CONVERTED` or `DISMISSED`;
- durable status history and internal prospect notes;
- immutable, versioned commercial proposals with fixed offer type, price,
  currency, timeline, preview capture, and scope;
- explicit proposal approval and rejection;
- one conversation per prospect with structured email, phone-note, or manual drafts;
- explicit draft approval and rejection;
- operator pages for prospect detail, proposals, and conversations;
- BullMQ orchestration from a qualified prospect through generation, Design
  Review, SEO/QA and a proposal that still requires human review;
- public proposal response page with explicit accept/opt-out decisions;
- 30-day unanswered-proposal retention cleanup and hashed suppression list;
- no email provider, send endpoint, or `SENT` status.

## Safety boundary

Phase 6 prepares commercial material but never sends it. An approved proposal
may be shared manually. Adding email delivery still requires a separate decision
covering the provider, applicable law, rate limits, and action-time human
confirmation.

## Acceptance workflow

1. Open `/prospects` and select a real OpenStreetMap prospect.
2. Qualify it and record an internal note.
3. Use **Lancer le workflow complet** and verify the parent Agent Job, generated
   Website Version, Design Review, SEO/QA report and `NEEDS_REVIEW` proposal.
4. Approve or reject the proposal from `/proposals`.
5. Generate an email draft, then approve or reject it from `/conversations`.
6. Confirm that no action sends a message or calls an email provider.

## Verification

```powershell
pnpm db:migrate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
