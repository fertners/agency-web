# Website theme and content pipeline

## Current restaurant workflow

Restaurant generation now builds and persists a structured generation context
inside every new `WebsiteVersion`:

1. validate the restaurant business data;
2. use a supplied `BrandProfile`, or derive a low-confidence profile from the
   explicitly supplied business data;
3. select one normalized restaurant theme from verified wording and brand
   signals;
4. fall back to `restaurant-elegant-v1` when the evidence is insufficient;
5. generate the content brief;
6. apply sourced brand colors and typography over the selected theme tokens;
7. omit menu, gallery, review, and opening-hours sections when their facts are
   unavailable;
8. persist the brand profile, source identifiers, content warnings, and theme
   decision with the immutable website version.

The active normalized themes are:

- `restaurant-elegant-v1` (`Restaurant Editorial`);
- `restaurant-warm-v1` (`Restaurant Maison`);
- `restaurant-modern-v1` (`Restaurant Studio`).
- `restaurant-chefs-kitchen-v1` (`Restaurant Chef's Kitchen`).

These themes use application-owned React components. A theme changes validated
tokens and composition data; it does not execute third-party or generated code.

## Provenance and content rules

Every brand source has a type, capture timestamp, and explicit list of claims.
Every asset has a source and usage status. Only data present at a validated
boundary may be used as a business fact.

The generation pipeline must never invent menus, prices, opening hours,
reviews, contact details, certifications, or commercial claims. Missing facts
cause the dependent section to be omitted and produce a visible warning in the
version context.

## Free external themes

The first external reference normalized into the controlled engine is Chef's
Kitchen at commit `2910c50abefa7a367015697f4cd5b96be95771fb`. Its repository
code is MIT. The upstream images have no individual asset attribution in the
audited repository, so none are included. Placeholder menus, people, claims,
authentication code, and its hard-coded external contact integration are also
excluded. See `packages/websites/THIRD_PARTY_NOTICES.md`.

External free themes remain reference material until both their code licence
and bundled asset licences have been audited. The application never clones or
executes an arbitrary repository during a generation job.

## Research to preview

Overpass candidates now preserve description, cuisines, raw opening hours,
social links, logo/image URLs, and an OpenStreetMap-backed `BrandProfile`.
External assets enter that profile as `PENDING_REVIEW`; they are not copied to a
website config until their usage status is `VERIFIED`.

`POST /websites/from-prospect/:prospectId` creates or reuses the Company website
and enqueues the normal BullMQ generation job. The Prospect detail page exposes
the same operation as **Generate Website**.

## Next increments

- add a human asset-licence review action;
- audit and normalize additional free Restaurant references;
- add the same pipeline for Barber and Hairdresser;
- show source-level evidence and warnings in the dashboard rather than only
  aggregate counts.
