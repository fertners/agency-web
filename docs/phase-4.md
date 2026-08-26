# Phase 4 acceptance record

## Delivered SEO and QA workflow

- deterministic restaurant SEO engine with title, description, canonical, local identity, image alt, H1, and structured-data checks;
- `Restaurant` JSON-LD, canonical metadata, and Open Graph metadata in the isolated preview;
- Playwright QA with axe-core accessibility violations and navigation/resource performance metrics;
- durable, idempotent quality reports linked to immutable website versions and agent jobs;
- asynchronous BullMQ quality worker with bounded retries;
- dashboard controls and per-category SEO, accessibility, and performance scores;
- independent acceptance thresholds: SEO 85, accessibility 85, performance 75, global 80, and no blocking issue;
- human approval remains separate from automated quality status.

## Real acceptance run

The restaurant preview completed the final local audit with `100/100`, `PASSED`, on the first worker attempt. An earlier audit exposed contrast and landmark defects; the template was corrected and fully re-audited rather than suppressing the violations.

## Commands

```powershell
pnpm infra:up
pnpm db:migrate
pnpm dev
pnpm check
```

Open `/websites`, choose **SEO + QA**, then refresh to inspect the global and category scores.
