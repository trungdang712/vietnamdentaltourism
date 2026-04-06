# Sync Guide for Anass — All Landing Pages

**Date:** April 6, 2026
**From:** Trung
**Priority:** URGENT — must do before any edits to ANY landing page

---

## What happened

We shipped major updates to ALL 4 landing pages on April 5-6. If you push changes without pulling first, you will overwrite these updates and break lead tracking.

---

## Pull ALL 4 repos before doing anything

### 1. dentalvietnam.vn

```bash
cd vietnamdentaltourism
git pull origin master
```

**What changed:**
| File | What's new |
|------|-----------|
| `detect-visitor.js` | **NEW FILE** — Auto-detects visitor's country and language from IP |
| `index.html` | Hero form now sends `name: '(Website inquiry)'` instead of empty. New script tag for detect-visitor.js. All forms include country, countryCode, preferredLanguage. Cache busters updated. |

### 2. allon4vietnam.com

```bash
cd allon4vietnam
git pull origin main
```

**What changed:**
| File | What's new |
|------|-----------|
| `detect-visitor.js` | **NEW FILE** — Country/language detection |
| `upload-helper.js` | **NEW FILE** — Photo upload (resize in browser → upload to S3) |
| `script.js` | Hero form now goes to Greenfield API (was going to Make.com only). Early capture no longer triggers false failure emails. All forms include country/language/UTM. Photo upload handler now real (was cosmetic). |
| `index.html` | New script tags for detect-visitor.js and upload-helper.js. Cache busters updated. "Max 25 MB" text. |

### 3. clearalignersvietnam.com

```bash
cd gflex-final
git pull origin main
```

**What changed:**
| File | What's new |
|------|-----------|
| `detect-visitor.js` | **NEW FILE** — Country/language detection |
| `index.html` | UTM capture added. Visitor detection (country, language, countryCode) added to form payload and both Sheets payloads. Country dropdown value now resolves to full name (e.g., "AU" → "Australia"). Fixed `UK` → `GB` in dropdown. GA4 tag added. |

**GA4 tag (already in `gflex.html`):**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CWRXTWQLBW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-CWRXTWQLBW');
</script>
```

### 4. dentalimplantsinvietnam.com

```bash
cd lp-implants-preview
git pull origin main
```

**What changed:**
| File | What's new |
|------|-----------|
| `detect-visitor.js` | **NEW FILE** — Country/language detection |
| `index.html` | UTM capture added. Visitor detection added to form payload. Fixed `formId` from `'dental-tourism-lp'` to `'dental-implants'`. Fixed Google Sheets `Content-Type` bug (was `application/json` with `no-cors`, now `text/plain`). |

---

## If you have uncommitted changes on any repo

```bash
git stash
git pull origin main    # or master for dentalvietnam
git stash pop
```

If you get merge conflicts, **keep the new versions** of these files — do not overwrite them:
- `detect-visitor.js` (entire file — never modify)
- `upload-helper.js` (entire file — never modify, allon4 only)
- Any lines containing `visitorData`, `preferredLanguage`, `countryCode`, `submitLead`, `submitLeadData`, `utmData`

---

## Rules when editing landing pages going forward

### Safe to change:
- Text content, headings, descriptions
- Images, videos, styling, CSS
- Adding new HTML sections
- Rearranging page layout

### Do NOT modify without asking Trung:
- `detect-visitor.js` — shared across all 4 pages, changes break country detection
- `upload-helper.js` — handles photo uploads on allon4
- Any JavaScript function named `submitLead`, `submitLeadData`, `submitHeroForm`, `handleSubmit`, `sendToSheet`, `sendToAPI`, `captureEarlyLead`
- The `<script>` tags at the bottom of HTML files and their `?v=` cache buster numbers
- Form `action` attributes or API endpoint URLs
- Google Sheets webhook URLs

### If you want to add a new form or change form fields:
Ask Trung first — the API needs to accept any new fields, and the lead capture layers need to be wired up.

---

## Why this matters

Before these updates:
- Every international lead showed "Country: Vietnam" regardless of where they're from
- Every lead showed "Language: vi" even English speakers
- dentalvietnam hero form showed blank name in CRM
- allon4 hero form leads went to Make.com only — NOT in the CRM
- clearaligners and dentalimplants had no UTM tracking
- dentalimplants had wrong formId and broken Google Sheets backup
- Photo uploads on allon4 were fake — files were never uploaded

All of this is now fixed. If any of these changes are overwritten, we lose the fixes.

---

## Quick check after pulling

For each repo, open the page in incognito and verify:
1. `detect-visitor.js` loads (check browser Network tab)
2. Submit a test lead → check that country shows correctly in CRM (not "Vietnam" if you're not in Vietnam)

---

## Questions?

Message Trung before pushing ANY changes to any landing page. A quick "I'm about to push updates to [page name]" is enough.
