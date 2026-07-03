---
name: update-website
description: >-
  Update the SciEngTech static website — products, solutions, components,
  categories, product images, and Knowledge Center blog articles. Edits
  data/catalog.json and data/knowledge.json, saves images under assets/products/,
  runs build:site, commits, and pushes to GitHub main for auto-deploy. Use when
  asked to add/update/remove a product, component, solution, category listing,
  product image, blog article, or Knowledge Center post, or to publish website
  changes to GitHub Pages.
---

# SciEngTech Website Updates

Use this skill when the client asks to change live site content: new products, updated copy, images, or blog posts.

**On task start:** read `reference.md`, `examples.md`, and `client-setup.md` from the same folder as this `SKILL.md` (skill install path or repo `.codex/skills/update-website/`).

## Repository

| Item | Value |
|------|-------|
| GitHub | `https://github.com/sciengtech/website` |
| Default branch | `main` |
| Live site | `https://sciengtech.github.io/website/` |
| Repo root | `website/` (all paths below are relative to this) |

**First-time setup:** see [client-setup.md](client-setup.md) for clone, Node.js, and GitHub credentials.

## Source-of-truth files

| File | Edit? | Controls |
|------|-------|----------|
| `data/catalog.json` | **Yes** | Solutions, components, categories, homepage carousel, search (via build) |
| `data/knowledge.json` | **Yes** | Knowledge Center / blog articles |
| `assets/products/{id}/` | **Yes** | Product photos (`primary.png`, `primary.jpg`, etc.) |
| `data/products.json` | **Never** | Auto-generated at build |
| `data/search-index.json` | **Never** | Auto-generated at build |

**Critical:** Do **not** run `npm run build` or `npm run ingest` after hand-editing JSON — docx ingest overwrites `catalog.json`.

## Request routing

| Client request | Action |
|----------------|--------|
| "Add this product" + image | Add to `catalog.json` → save image → build → commit → push |
| "Update product X" | Find by `id` in `catalog.json` → edit fields → refresh `_search` if text changed |
| "Add this blog / article" | Add to `data/knowledge.json` → build → commit → push |
| "Change product image" | Replace file in `assets/products/{id}/` and/or update `image` path in catalog |
| "Remove product" | Remove from `catalog.json` array → update `counts` → build → push |

Before editing, read [reference.md](reference.md) for field details. Walkthroughs: [examples.md](examples.md). Setup: [client-setup.md](client-setup.md).

## Standard workflow

Copy and track this checklist:

```
- [ ] git pull origin main
- [ ] Edit JSON and/or save images
- [ ] Regenerate _search for any changed catalog item
- [ ] Update counts and updated date in JSON root
- [ ] npm run build:site
- [ ] Verify no build errors
- [ ] git add (only intended files)
- [ ] git commit
- [ ] git push origin main
- [ ] Confirm GitHub Actions deploy succeeded
```

### 1. Sync before editing

```powershell
cd website
git pull origin main
```

### 2. Make content changes

Follow the matching section below (product, blog, or image-only).

### 3. Build locally

```powershell
npm run build:site
```

This regenerates HTML, `products.json`, and `search-index.json`. Fix any JSON syntax errors before continuing.

### 4. Commit and push

```powershell
git status
git add data/catalog.json data/knowledge.json assets/products/
git commit -m "content: <short description of change>"
git push origin main
```

Use a clear commit message, e.g. `content: add SET-FOO linear stage component` or `content: publish PCX lenses blog article`.

### 5. Deploy

Pushing to `main` triggers `.github/workflows/deploy-pages.yml` when these paths change:

- `data/catalog.json`, `data/knowledge.json`
- `assets/**`, `scripts/**`, `css/**`, `js/**`, `partials/**`

CI runs `npm run build:site` and publishes to GitHub Pages. Check: **GitHub → Actions → "Deploy to GitHub Pages"**.

Deploy usually completes in 2–5 minutes. Live URL: `https://sciengtech.github.io/website/`

## Add a component (bench product)

1. Read `data/catalog.json` — confirm `id` and `sku` are unique.
2. Choose `category`: `opto-mechanics`, `motion-and-positioning`, `hardware`, `fibre-optics`, `lasers`, `optics`, or `lab-accessories`.
3. Choose `pageTemplate`: `component` (default), `variant-catalog` (SKU table), or `configurable` (option chips).
4. Append to `components` array. Minimal template:

```json
{
  "id": "my-component",
  "sku": "SET-MYCOMP",
  "name": "My Component",
  "type": "component",
  "pageTemplate": "component",
  "aliases": [],
  "overview": ["Description paragraph."],
  "features": ["Feature 1"],
  "applications": ["Application 1"],
  "techSpecs": [{ "label": "Material", "value": "SS303" }],
  "keyValueSpecs": [],
  "variants": [],
  "configurationOptions": null,
  "rfqSections": null,
  "solutionContent": null,
  "customNote": null,
  "summary": "Short card summary.",
  "specHighlight": "Key spec · second spec",
  "specs": [{ "label": "Procurement", "value": "Request Technical Quote" }],
  "body": "Full plain-text writeup for search.",
  "image": "assets/products/my-component/primary.png",
  "tags": ["my component", "opto-mechanics"],
  "writeupPath": null,
  "category": "opto-mechanics",
  "categoryLabel": "Opto-Mechanics",
  "categoryPath": "/components/opto-mechanics.html",
  "_search": ""
}
```

5. **Image:** save client-provided image as `assets/products/{id}/primary.png` (or `.jpg`/`.webp`). Set `image` to match.
6. **Regenerate `_search`** (lowercase, join id, sku, name, type, category, categoryLabel, summary, specHighlight, aliases, tags, body).
7. Bump `updated` and `counts.components` at catalog root.

**Live URL after deploy:** `product.html?id=my-component`

## Add a solution (kit / turnkey system)

1. Append to `solutions` array in `catalog.json`.
2. Set `solutionGroup`: `quantum-setups`, `training-kits`, or `state-of-the-art-setups`.
3. Set `pageTemplate`: `solution` (kit bullets), `configurable` (quote-driven), or `variant-catalog`.
4. Include `solutionUrl`: `solutions/{id}.html`.
5. Image at `assets/products/{id}/primary.png`.
6. Regenerate `_search`, bump `counts.solutions` and `updated`.

**Live URL:** `solutions/{id}.html`

Check `scripts/patch-solutions-catalog.mjs` — it may override specific solution fields on build.

## Add a blog article (Knowledge Center)

Edit `data/knowledge.json` only (not catalog).

1. Ensure `categories` includes the article category (`slug` + `label`).
2. Append to `articles`:

```json
{
  "id": "new-article-slug",
  "title": "Article Title",
  "summary": "Plain-text teaser under ~130 characters.",
  "published": "2026-07-01",
  "modified": "2026-07-01",
  "category": "lenses",
  "categoryLabel": "Lenses",
  "tags": ["relevant", "tags"],
  "legacyUrl": null,
  "legacyId": null,
  "body": "<p>HTML content.</p>"
}
```

3. **Images in body:** use site-relative paths (`../../assets/...`) or hosted URLs. First `<img>` becomes the hub card thumbnail.
4. **Internal links:** contact → `../../company/contact.html`; other articles → `other-slug.html`.
5. Bump `updated` at knowledge root.

**Live URL:** `engineering/knowledge/{id}.html`

## Image handling

| Task | Path / field |
|------|----------------|
| Product hero image | `assets/products/{id}/primary.png` |
| Catalog reference | `"image": "assets/products/{id}/primary.png"` |
| Multiple gallery images | `"images": ["assets/products/{id}/primary.png", "..."]` |
| Blog inline image | `<img src="../../assets/...">` in `body` HTML |

**Naming rules for `id`:** lowercase, hyphens only, unique, max ~80 chars (matches folder name).

When the client attaches an image in chat, save it to the correct `assets/products/{id}/` path before committing.

## `_search` helper

Regenerate whenever name, sku, summary, body, tags, or category changes:

```javascript
[id, sku, name, type, solutionGroup || category, categoryLabel,
 summary, specHighlight, (aliases||[]).join(' '), (tags||[]).join(' '), body||'']
 .join(' ').toLowerCase();
```

## Pre-push checklist

- [ ] Valid JSON (no trailing commas)
- [ ] Unique `id` and `sku`
- [ ] Correct `type`: `solution` vs `component`
- [ ] Solutions have `solutionGroup`; components have `category` + `categoryLabel`
- [ ] `_search` updated for every changed catalog item
- [ ] `image` path matches an existing file
- [ ] `counts` and `updated` bumped
- [ ] Did **not** run `npm run build` or `npm run ingest`
- [ ] `npm run build:site` succeeded locally
- [ ] Only intended files staged (no `.env`, credentials, or secrets)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Change not on live site | Wait for GitHub Action; hard-refresh browser |
| Product missing in search | Regenerate `_search` |
| Build fails | Fix JSON syntax; run `npm run build:site` again |
| Push rejected | `git pull origin main`, resolve conflicts, push again |
| Catalog edits lost | Someone ran `npm run ingest` — restore from git history |
| Blog not updating | Edit `knowledge.json`, not `catalog.json` |

## Examples

See [examples.md](examples.md) for full walkthroughs of common client requests.
