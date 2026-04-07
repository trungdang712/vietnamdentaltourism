# CLAUDE.md — Vietnam Dental Tourism Landing Page

## Overview

Single-page static landing page for dental tourism marketing, targeting international patients (primarily AU, US, UK). Promotes Greenfield Dental's implant, veneer, crown, and orthodontic services with cost-savings messaging.

**Live:** https://dentalvietnam.vn

## Repo & Deployment

- **Repo:** `github.com/trungdang712/vietnamdentaltourism` (branch: `master`)
- **Deploy:** Vercel (team: `greenfield-dental`, project: `vietnamdentaltourism`, ID: `prj_gA6UP1rPoX2K75J6PQYJkH8LiIWw`)
- **Auto-deploy:** Push to `master` → production on `dentalvietnam.vn`
- No build step — static HTML served directly

## File Structure

```
index.html              — Entire site: HTML + CSS + JS (~9,000 lines, single file)
google-apps-script.js   — Google Sheets webhook for lead backup (deployed separately in Apps Script)
robots.txt              — Basic crawl config
sitemap.xml             — Single-page sitemap
```

## Architecture

Everything is in `index.html` — no framework, no bundler, no dependencies. Inline `<style>` and `<script>` tags.

### CSS Variables

```css
--navy: #0c3535;
--navy-light: #164444;
--gold: #c49a6c;
--gold-light: #d4b080;
```

### Fonts

- **Headings:** Playfair Display (Google Fonts, loaded async)
- **Body:** DM Sans (Google Fonts, loaded async)

## Lead Capture — 5-Layer Safety Net

Leads are submitted through a multi-step consultation form (3 steps: Treatment → Contact → Timeline).

1. **Primary:** Greenfield API (`POST https://api.greenfield.clinic/api/contacts/dental-tourism`)
2. **Fallback:** Google Sheets webhook (`google-apps-script.js` — routes to `dentalvietnam` tab)
3. **LocalStorage backup** — stores unsent leads for retry
4. **Console logging** — for debugging
5. **Error alerting** — notifies on failure

### Google Apps Script

- Webhook URL is in `index.html` (search `SHEET_WEBHOOK`)
- Routes leads by form prefix: `dental-tourism-*` → `dentalvietnam` tab, others → `allon4vietnam` tab
- Alert email: `anass.l@nhakhoagreenfield.com`, CC: `trung@nhakhoagreenfield.com, hello@nhakhoagreenfield.com`
- Deploy via: Google Apps Script → Manage deployments → New version → Deploy

## Tracking & Analytics

- **GTM:** `GTM-P9F52DWS` (deferred load on first interaction)
- **Facebook Pixel:** `26443098325275263`
- **Google Ads:** Conversion `AW-11508258289/ak2wCKyC3PwZEPGryO8q` (fires on lead submit)
- **Google Consent Mode v2:** Default denied, updates on cookie accept

## Key Sections (in order)

1. Hero with quick assessment form
2. Trust bar (brand logos)
3. Why Vietnam / cost comparison
4. Treatment cards grid (implants, veneers, crowns, etc.)
5. Before/after gallery
6. Patient reviews
7. Doctor profiles
8. Journey steps (how it works)
9. Multi-step consultation form (main conversion)
10. FAQ
11. Footer

## Conventions

- **Never commit `.md` files** — markdown files (e.g. `SUMMARY-FOR-ANASS.md`, `lead-capture.md`, `SEO-DENTALVIETNAM-PROMPT.md`) are local docs only, not part of the deployed site
- **No build process** — edit `index.html` directly
- All CSS is inline in `<style>` tags (base styles + overrides + responsive)
- All JS is inline in `<script>` tags at the bottom
- Responsive breakpoints: 900px (tablet), 600px (small tablet), 480px (mobile)
- Images are in `/images/` directory (gitignored, hosted externally or inlined as base64)

## Brand Assets & Clinic Info — Source of Truth

This landing page is static HTML outside the monorepo — it can't hit the API at build time. Still, **do not redesign the Greenfield logo ad-hoc or invent new clinic info**.

- **Logo source of truth:** `s3://greenfield-clinic-files/assets/brand/` (ap-southeast-1), 4 variants: `Greenfield-{original,white,black,Grayscale}.svg` + matching `.png`. Use the `white` variant on dark backgrounds.
- **To update the local logo:** download the correct variant from the S3 URL (public), replace the file in-place, commit. Do not sketch a new logo.
- **Clinic name / address / phone / email / WhatsApp:** single source of truth is the `ClinicSetting` row in `greenfield-platform` (edited via `Settings → Clinic Profile` in the staff portal). If any of these change there, mirror the value manually in `index.html`. Convenient reference (no auth): `GET https://api.greenfield.clinic/api/settings/clinic-profile`.
- **API endpoint + WhatsApp** are already centralized as `const` near the top of the inline JS in `index.html` — keep them there if you add more clinic references.

## Related Projects

- **Greenfield Platform:** `/Users/trungdang/Dev - Greenfield Dental/greenfield-platform/` — main monorepo (API, staff portal, website)
- **AllOn4 Vietnam:** `allon4vietnam` Vercel project — separate landing page at `allon4vietnam.com`
- Both landing pages share the same Greenfield API for lead capture and Google Sheets webhook for backup

## Adversarial Review Protocol

Every major feature prompt MUST go through adversarial review before implementation. This protocol has caught P0 bugs in every phase of the treatment system — bugs that would have been 10x harder to fix in production.

### Workflow

```
Write spec → Claude Code reviews (do NOT implement) → Counter-review → Revise → Repeat
```

1. **Write the spec** — schema, endpoints, components, tests
2. **Paste to Claude Code** with the review instruction (see template below)
3. **Bring review back** — counter-review EVERY point with agree/disagree + reasoning
4. **Revise the spec** — apply agreed changes
5. **Review again** if structural changes were made (new endpoints, schema changes, changed data flow)
6. **Run only** after no P0/P1 issues remain

Typically 2-4 rounds. Don't skip rounds to save time — each round catches different class of bugs.

### Review Instruction Template

```
Review the attached spec. Do NOT implement — just review brutally.

Context:
- What exists: [list existing modules, endpoints, models touched]
- What's new: [list new models, endpoints, components]
- What v(N-1) review found: [list P0/P1 fixes from last round, if any]

Review targets:
1. SCHEMA: relation collisions, FK types match, onDelete behavior, missing indexes, User model bloat
2. ROUTES: conflicts (NestJS evaluates top-down), RBAC per endpoint, DTO completeness
3. DATA FLOW: sequencing (does entity X exist when you need its ID?), atomicity (multi-call orchestration), race conditions
4. FRONTEND: component receives correct data shape, mutation cache invalidation, error handling on every mutation
5. EDGE CASES: null vs undefined vs 0, cross-entity validation (patient A's data on patient B), concurrent users
6. RUNTIME RULES: [list project-specific rules — ESM imports, injection patterns, mock patterns]
7. TESTS: every P0/P1 issue must have a corresponding test. Missing test = missing coverage.

Be brutal. I'd rather fix the plan than debug production.
```

### What the Reviewer Must Check

#### Schema Review Checklist
- [ ] New FK column type matches target table's ID type (TEXT vs UUID)
- [ ] `onDelete` behavior specified on every FK (Cascade? SetNull? Restrict?)
- [ ] Reverse relation name doesn't collide with existing relations on the target model
- [ ] If relating to User model: does this NEED a Prisma relation or is a plain String field sufficient? (~80 relations already on User — avoid bloat)
- [ ] `@@index` on every new FK column
- [ ] `@@map` on every new column (snake_case in DB)
- [ ] Migration SQL matches schema — no drift between Prisma model and raw SQL
- [ ] Backfill strategy for existing rows (nullable with backfill vs NOT NULL with default)
- [ ] No stored columns that should be computed on read (or vice versa — stored is needed for WHERE queries)

#### API Review Checklist
- [ ] Every endpoint has explicit `@Roles(...)` — no "all authenticated" by accident
- [ ] DTOs use correct validators: `@IsNumber()` not `@IsDecimal()`, `@IsIn()` not `@IsEnum(array)`
- [ ] Update DTOs are fully spec'd — not "TODO: add later"
- [ ] No `...dto` spread into Prisma — explicit field picks prevent future field leaks
- [ ] Falsy checks use `!== undefined` not `||` (0 and '' are valid values)
- [ ] `findUnique` + `throw NotFoundException` instead of `findUniqueOrThrow` (clean 400, not raw Prisma P2025)
- [ ] Cross-entity validation: if accepting entityId from user input, validate it belongs to the same parent (patient, plan, etc.)
- [ ] Auto-derive where possible: if phaseId implies planId, don't require both — derive planId from phase
- [ ] Conflict check: if two related IDs are provided, verify they're consistent (400 if mismatch)
- [ ] Status checks: reject operations on COMPLETED/CANCELLED entities
- [ ] Constructor uses `DatabaseService` injection, not `@Inject('DATABASE_CONNECTION')`
- [ ] No runtime imports from `@greenfield/shared` — types only (Railway ESM rejects barrel imports)
- [ ] `Number()` for Decimal conversions, not `new Decimal()` (avoids Prisma runtime import)

#### Frontend Review Checklist
- [ ] **Sequencing:** Does entity X exist when you need its ID? (biggest source of P0 bugs)
- [ ] **Data shapes:** Component receives list item for header, fetches detail only on expand (two-layer pattern)
- [ ] **Query gating:** `enabled: !!condition` on queries that shouldn't fire unconditionally
- [ ] **Cache invalidation:** Every mutation invalidates the correct query keys (detail + list)
- [ ] **Error handling:** Every mutation has `onError` with toast — no silent failures
- [ ] **RBAC visibility:** Action buttons hidden for unauthorized roles, not just rejected by API
- [ ] **Loading states:** Spinner on the active button, disable sibling buttons during mutation
- [ ] **i18n:** Zero hardcoded strings — every user-facing text through `t()`
- [ ] **No hardcoded IDs:** Template IDs, entity IDs fetched dynamically or matched by category/name
- [ ] **Stale params:** URL params (`?phaseId=`) validated before use — entity may have changed status
- [ ] **Dialog reset:** Form state clears on close, not just on submit
- [ ] **Confirm dialogs:** Irreversible actions (delete, advance final phase) require confirmation
- [ ] **Existing behavior preserved:** When modifying existing handlers, the original behavior must still work

#### Data Flow Review Checklist
- [ ] **Atomicity:** Multi-step operations (create + apply template) should be 1 API call with transaction, not frontend orchestration
- [ ] **Orphan prevention:** If step 2 fails after step 1 succeeds, what's the user experience? (error toast + manual recovery is acceptable, silent data corruption is not)
- [ ] **Cascade behavior:** When parent entity changes status (phase COMPLETED), what happens to children? What about reverse — child completion triggers parent sync?
- [ ] **Recurring logic:** Does cascade/recalculation skip non-final recurring occurrences?
- [ ] **Sort order:** Sequential (`baseSortOrder + i`), not sparse (`baseSortOrder + entity.sortOrder`)
- [ ] **Naming:** Clean base name in DB, display name computed on read (no regex stripping)
- [ ] **Concurrent access:** Two users performing the same action simultaneously — what breaks?

#### Test Coverage Review Checklist
- [ ] Every P0/P1 bug from the review has a dedicated test
- [ ] Cross-entity validation has positive AND negative tests
- [ ] Null vs 0 vs undefined tested separately for optional numeric fields
- [ ] Status transitions tested: valid transitions succeed, invalid ones return 400
- [ ] RBAC tested per role: authorized succeeds, unauthorized returns 403
- [ ] Cascade behavior tested: delete parent → verify child state
- [ ] Idempotent operations tested: calling twice returns same result (not error)
- [ ] Error messages tested: 400/404 responses have meaningful messages (not Prisma internals)

### Counter-Review Rules

When reviewing the reviewer's feedback:

1. **Go point by point** — don't skip any item
2. **State agree or disagree** with reasoning for each
3. **If you disagree, explain why** — "the reviewer assumes X but actually Y"
4. **If you agree, state the fix** — not just "agree" but "agree, fix: change X to Y"
5. **Don't add scope** — if a suggestion is valid but out of scope, say "agree but defer to phase N"
6. **Track severity** — P0 (data corruption, security hole), P1 (broken UX, wrong behavior), P2 (polish, consistency)
7. **P0 issues block implementation** — no exceptions. Fix the spec first.

### What This Protocol Catches (Real Examples)

| Phase | Bug | Severity | How Caught |
|-------|-----|----------|------------|
| Phase 2 | sortOrder collision for recurring phases | P0 | Review round 1 |
| Phase 2 | recalculateNextPhaseStart fires incorrectly mid-series | P0 | Review round 2 |
| Phase 2 | syncPlanStatus missing actualStartDate in select | P1 | Review round 3 |
| Phase 2 | @IsDecimal() doesn't validate numbers | P1 | Review round 3 |
| Phase 3 | Route conflict: /templates caught as :planId | P0 | Review round 1 |
| Phase 3 | apply-template sortOrder math wrong with sparse values | P1 | Review round 1 |
| Phase 4 | PlanCard fetches detail unconditionally (N+1 queries) | P1 | Review round 1 |
| Phase 4 | No RBAC on action buttons | P1 | Review round 1 |
| Phase 4 | Hardcoded Vietnamese strings (breaks English UI) | P1 | Review round 1 |
| Phase 5 | Treatment doesn't exist when SOAP prompt renders | P0 | Review round 1 |
| Phase 5 | No cross-patient phaseId validation | P0 | Review round 1 |
| Phase 5 | 4 sequential API calls with no atomicity | P1 | Review round 1 |

Every one of these would have shipped to production without the review loop.
