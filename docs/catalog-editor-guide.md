# SciEngTech site data editor guide

This document explains how to control the live website by editing JSON data files, how to rebuild and deploy, and includes **LLM instructions** for adding catalog products and Knowledge Center articles.

---

## Quick reference

| File | Controls | Loaded at |
|------|----------|-----------|
| `data/catalog.json` | Solutions, components, homepage carousel, category pages, solution detail pages, search index (via build) | **Build time** (+ derived JSON at runtime) |
| `data/knowledge.json` | Knowledge Center / blog articles | **Build time** |
| `data/products.json` | Legacy build artifact (no longer used at runtime) | **Build output** — optional |
| `data/search-index.json` | Catalog search, header search, filters | **Browser** (auto-generated — do not edit by hand) |

**Rule:** After editing `catalog.json` or `knowledge.json`, run a site build and deploy. Pushing JSON alone does not update static HTML until CI runs `npm run build:site`.

```powershell
cd sciengtech-revamp
npm run build:site
```

On `main`, GitHub Actions runs `build:site` and deploys to GitHub Pages when `data/catalog.json`, `data/knowledge.json`, or related paths change.

---

## What `catalog.json` does *not* control

These pages are **hardcoded** in `scripts/build-site.mjs` (not driven by catalog):

- `company/about.html`, `company/contact.html`
- `company/legal/terms.html`, `company/legal/privacy.html`
- `engineering/rfq.html` (form shell; cart uses `localStorage` + catalog at runtime)
- `thank-you.html`, `404.html`
- Header / footer chrome (`partials/*.html`)

Edit those files or `build-site.mjs` directly if copy needs to change.

---

## Catalog top-level shape

```json
{
  "version": 2,
  "updated": "2026-07-01",
  "solutions": [ /* turnkey systems & kits */ ],
  "components": [ /* bench hardware */ ],
  "counts": { "solutions": 14, "components": 47 }
}
```

- **`solutions`** — appear on `solutions.html`, group hubs, and `solutions/{id}.html`
- **`components`** — appear on category pages, `catalog.html`, and `product.html?id={id}`

Update `updated` and `counts` when you add or remove items (counts are informational; build recomputes derived files).

---

## Field → site mapping

### Identity & URLs

| Field | Solutions | Components | Affects |
|-------|-----------|------------|---------|
| `id` | ✓ | ✓ | URL slug: `solutions/{id}.html` or `product.html?id={id}` |
| `sku` | ✓ | ✓ | Cards, detail page, search, cart |
| `name` | ✓ | ✓ | Page title, cards, carousel, search |
| `type` | `"solution"` | `"component"` | Routing and search filters |
| `aliases` | optional | optional | Search + subtitle on detail page |

**`id` rules:** lowercase, hyphens only, unique, max ~80 chars. Example: `entangled-photon-source`.

### Grouping

| Field | Used by | Valid values |
|-------|---------|--------------|
| `solutionGroup` | Solutions only | `quantum-setups`, `training-kits`, `state-of-the-art-setups` |
| `category` | Components only | `opto-mechanics`, `motion-and-positioning`, `hardware`, `fibre-optics`, `lasers`, `optics` |
| `categoryLabel` | Both (display) | Human label, e.g. `"Opto-Mechanics"` |
| `solutionUrl` | Solutions | Auto-set at build: `solutions/{id}.html` |
| `categoryPath` | Components | e.g. `/components/hardware.html` |

**Solution group hubs:**

| `solutionGroup` | Hub page |
|-----------------|----------|
| `quantum-setups` | `solutions/quantum-setups.html` |
| `training-kits` | `solutions/training-kits.html` |
| `state-of-the-art-setups` | `solutions/state-of-the-art-setups.html` |

### Listing & search text

| Field | Purpose |
|-------|---------|
| `summary` | Short description; meta / cards |
| `specHighlight` | Mono line on product cards and carousel spec caption |
| `specs` | Legacy mini spec rows `[{ "label", "value" }]` |
| `_search` | **Required for search.** Lowercase blob of id, sku, name, category, summary, body, tags, etc. See [Search index](#search-index-_search) below. |
| `tags` | Extra keywords for `_search` and internal use |

### Images

| Field | Purpose |
|-------|---------|
| `image` | Path relative to site root, e.g. `assets/products/washer/primary.png` |

**Image file location:** `assets/products/{id}/primary.{png|jpg|jpeg|webp}`

If `image` is `null`, the homepage carousel uses placeholder SVGs from `assets/slides/01–06-*.svg`.

### Page layout (`pageTemplate`)

| Template | Best for | Detail page sections |
|----------|----------|----------------------|
| `solution` | Educational / turnkey kits with rich bullet content | What This Kit Demonstrates, What's Included, Key Capabilities |
| `configurable` | Quote-driven systems or components with option chips | Overview, Configuration Options, RFQ parameters, Features/Applications |
| `component` | Standard bench parts with features + spec table | Overview, Features, Applications, tech spec table |
| `variant-catalog` | One product, many SKUs in a table | Overview, variant table with per-SKU Add to Cart |

### Content blocks (solutions)

```json
"solutionContent": {
  "tagline": "Optional hero tagline",
  "demonstrates": ["Bullet 1", "Bullet 2"],
  "kitIncludes": ["Item included in kit"],
  "capabilities": ["Technical capability"]
}
```

- `solution` template renders **demonstrates**, **kitIncludes**, **capabilities**
- `configurable` solution template uses **overview** + **rfqSections** instead

### Content blocks (components)

```json
"overview": ["Paragraph 1"],
"features": ["Feature bullet"],
"applications": ["Application bullet"],
"techSpecs": [{ "label": "Travel range", "value": "≥ 25 mm" }],
"keyValueSpecs": []
```

Use `techSpecs` for the spec table. Prefer `techSpecs` over duplicating in `specs` when possible.

### Variants (`pageTemplate: "variant-catalog"`)

```json
"variants": [
  {
    "sr": 1,
    "length_mm": "200",
    "width_mm": "200",
    "product_code": "SET-BB-2020",
    "sku": "SET-BB-2020"
  }
]
```

- Each row needs `sr` (row number) and `sku` (or `product_code` / `set_code`)
- Other keys become table columns (snake_case → Title Case labels)
- Set `specHighlight` like: `"8 configurations available · SKU from SET-BB-2020"`

### Configuration options (`pageTemplate: "configurable"`)

```json
"configurationOptions": {
  "metric_type": ["M3", "M4", "M5"],
  "thickness_mm": ["1.0", "2.0", "3.0"]
}
```

Renders as non-selectable chips (quote reference only). Use `null` if not applicable.

### RFQ sections (configurable solutions)

```json
"rfqSections": [
  {
    "id": "requirements",
    "title": "Specify Your Requirements",
    "parameters": [
      "Application and experimental goals",
      "Wavelength / spectral range"
    ]
  }
]
```

### Raw source

| Field | Purpose |
|-------|---------|
| `body` | Full plain-text writeup; feeds `_search` and archival reference |
| `writeupPath` | Source docx path if ingested; `null` for manual entries |

---

## Site areas controlled by catalog

### Homepage hero carousel (5 slides)

**Logic** (`scripts/build-site.mjs`):

1. Filter `solutions` where `solutionGroup === "quantum-setups"`
2. Take the **first 5** in array order
3. Image: `image` or placeholder SVG
4. Title: `name`
5. Caption: `specHighlight`
6. Link: `solutionUrl`

**To control slides via catalog:**

- Set `solutionGroup` to `quantum-setups` for eligible items
- **Reorder** those entries earlier in the `solutions` array
- Set `image`, `name`, `specHighlight` on each

Training kits and state-of-the-art setups **do not** appear in the carousel unless you change the build script.

### Homepage horizontal strip (“Quantum set-ups & training kits”)

- **All** solutions, in `solutions` array order
- Thumbnail: `image` or placeholder
- Link: `solutions/{id}.html`

### Solutions hub & sub-hubs

| Page | Contents |
|------|----------|
| `solutions.html` | All solutions grouped by `solutionGroup` |
| `solutions/quantum-setups.html` | `solutionGroup === "quantum-setups"` |
| `solutions/training-kits.html` | `solutionGroup === "training-kits"` |
| `solutions/state-of-the-art-setups.html` | `solutionGroup === "state-of-the-art-setups"` |

### Solution detail pages

- One static page per solution: `solutions/{id}.html`
- Built from full solution object + `pageTemplate`

### Component category pages

| Page | `category` value |
|------|------------------|
| `components/opto-mechanics.html` | `opto-mechanics` |
| `components/motion-and-positioning.html` | `motion-and-positioning` |
| `components/hardware.html` | `hardware` |
| `components/fibre-optics.html` | `fibre-optics` |
| `components/lasers.html` | `lasers` |
| `components/optics.html` | `optics` |

Order on category page = order in `components` array within that category.

### Full catalog & search (`catalog.html`)

- Built at runtime from `search-index.json` (generated at build from catalog)
- Filter by `type` (solution/component) and `category` / `solutionGroup`
- Card text: `name`, `specHighlight`, `sku`, `image`

### Component detail (`product.html?id={id}`)

- Runtime load from `catalog.json` (`components` array) for `product.html` and RFQ pre-fill
- Same templates as above

### Sitemap

- Build adds every `solutions/{id}.html` and category page automatically
- Does **not** list every `product.html?id=` URL (components use dynamic page)

---

## Search index (`_search`)

The build copies each item’s `_search` into `data/search-index.json`. Header search and catalog search tokenize this field.

**When adding or editing catalog entries manually**, regenerate `_search` as lowercase text joining:

```
id, sku, name, type, solutionGroup OR category, categoryLabel,
summary, specHighlight, aliases, tags, body
```

Example helper logic (same as ingest):

```javascript
[
  id, sku, name, type,
  solutionGroup || category,
  categoryLabel,
  summary, specHighlight,
  (aliases || []).join(' '),
  (tags || []).join(' '),
  body || ''
].join(' ').toLowerCase();
```

If `_search` is missing or stale, the product will not appear in search results.

---

## Build commands

| Command | When to use |
|---------|-------------|
| `npm run build:site` | **Default.** Rebuild HTML + derived JSON from committed `catalog.json`. Use after manual catalog edits. |
| `npm run build` | Full pipeline: slide placeholders + **re-ingest docx** + build. **Overwrites `catalog.json` from Word files.** |
| `npm run ingest` | Only regenerate catalog from `_writeup/Webpage_Writeup/` docx files |
| `npm run migrate-knowledge` | Pull articles from live WordPress into `knowledge.json` |

**⚠️ Never run `npm run build` or `npm run ingest` if you only edited `catalog.json` by hand** — docx ingest will replace your changes.

---

## Post-build patches

`scripts/patch-solutions-catalog.mjs` runs on every build and may **override** specific solution fields (renames, manual solutions, group moves). Check this file before wondering why a field reverted. Examples:

- Renames bomb tester and QKD display names
- Moves `regenerative-delay-line` to `state-of-the-art-setups`
- Injects manual solutions (CW lasers, supercontinuum, etc.)

To permanently change patched fields, edit `patch-solutions-catalog.mjs` or ensure your catalog values match what the patch expects.

---

# Knowledge Center (`data/knowledge.json`)

Blog / technical articles live in a **separate** file from the product catalog.

## File shape

```json
{
  "version": 1,
  "updated": "2026-07-01",
  "source": "https://sciengtech.in/knowledge-center/",
  "categories": [
    { "slug": "lenses", "label": "Lenses" }
  ],
  "articles": [ /* ... */ ]
}
```

## Article object

```json
{
  "id": "plano-convex-pcx-lenses",
  "title": "Plano-Convex (PCX) Lenses",
  "summary": "Short excerpt for hub cards (plain text, ~130 chars).",
  "published": "2022-05-10",
  "modified": "2022-09-03",
  "category": "lenses",
  "categoryLabel": "Lenses",
  "tags": ["lenses", "spherical-lenses"],
  "legacyUrl": "https://sciengtech.in/plano-convex-pcx-lenses/",
  "legacyId": 1528,
  "body": "<p>HTML content...</p>"
}
```

| Field | Purpose |
|-------|---------|
| `id` | URL: `engineering/knowledge/{id}.html` |
| `summary` | Hub card teaser |
| `body` | HTML article content; first `<img src="...">` used as hub thumbnail |
| `category` | Must match a `categories[].slug` |
| `published` / `modified` | ISO date `YYYY-MM-DD` shown on article page |

**Build output:**

- `engineering/knowledge/index.html` — hub grid
- `engineering/knowledge/{id}.html` — article page
- Root redirect: `{id}.html` → `engineering/knowledge/{id}.html` (for legacy URLs)
- `knowledge-center.html` → hub index

**Link style in `body`:** Use relative paths like `../../company/contact.html` or same-folder article slugs (`other-article.html` — rewritten at build).

---

# LLM instructions: add a solution

Use when asked to add a new turnkey system or educational kit to the catalog.

## Preconditions

- Read existing `data/catalog.json` for naming patterns and duplicate `id` / `sku` check.
- Do **not** run `npm run ingest`.
- Prefer editing `catalog.json` only, then document that user must run `npm run build:site`.

## Steps

1. **Choose `id`** — slug from product name (lowercase, hyphens).
2. **Choose `solutionGroup`:**
   - Quantum research/demo → `quantum-setups`
   - Classroom kits (Fourier, polarization, etc.) → `training-kits`
   - Advanced/custom ultrafast → `state-of-the-art-setups`
3. **Choose `pageTemplate`:**
   - Rich kit with demonstrates/includes → `solution`
   - Custom/quote-only system → `configurable` + `rfqSections`
4. **Append** new object to `solutions` array with required fields:

```json
{
  "id": "my-new-system",
  "sku": "SET-MYNEW",
  "name": "My New System",
  "type": "solution",
  "pageTemplate": "solution",
  "aliases": [],
  "overview": [],
  "features": [],
  "applications": [],
  "techSpecs": [],
  "keyValueSpecs": [],
  "variants": [],
  "configurationOptions": null,
  "rfqSections": null,
  "solutionContent": {
    "tagline": null,
    "demonstrates": ["What the kit demonstrates"],
    "kitIncludes": ["What's in the box"],
    "capabilities": ["Key technical points"]
  },
  "customNote": null,
  "summary": "One-line summary for cards and SEO.",
  "specHighlight": "Short mono spec line · Request Technical Quote",
  "specs": [{ "label": "Procurement", "value": "Request Technical Quote" }],
  "body": "Plain text full writeup for search.",
  "image": "assets/products/my-new-system/primary.png",
  "tags": ["my new system", "quantum set-up"],
  "writeupPath": null,
  "solutionGroup": "quantum-setups",
  "solutionUrl": "solutions/my-new-system.html",
  "categoryLabel": "Quantum Set-Ups",
  "_search": ""
}
```

5. **Set `_search`** — concatenate all searchable fields, lowercase (see [Search index](#search-index-_search)).
6. **Image** — if file provided, place at `assets/products/{id}/primary.png` and set `image` path.
7. **Update** root `updated` date and `counts.solutions`.
8. **Check** `patch-solutions-catalog.mjs` does not conflict with your entry.
9. Tell user to run `npm run build:site` and deploy.

## Configurable solution variant (quote-driven)

Use `pageTemplate: "configurable"` and populate:

```json
"overview": ["Summary paragraph", "Customized as per user requirements."],
"rfqSections": [{
  "id": "requirements",
  "title": "Specify Your Requirements",
  "parameters": [
    "Application and experimental goals",
    "Wavelength / spectral range",
    "Power, repetition rate, or bandwidth targets",
    "Integration and mounting requirements",
    "Timeline and quantity"
  ]
}],
"solutionContent": {
  "tagline": "Customized as per user requirements",
  "demonstrates": ["Summary"],
  "kitIncludes": [
    "Engineering consultation and specification review",
    "Turnkey or modular delivery scoped to your quote"
  ],
  "capabilities": ["Customized as per user requirements."]
},
"customNote": "Customized as per user requirements.",
"specHighlight": "Customized as per user requirements · Request Technical Quote"
```

---

# LLM instructions: add a component

## Steps

1. **Choose `id`** and **`category`** (one of the six slugs).
2. **Choose `pageTemplate`:**
   - Features + spec table → `component`
   - Multiple SKUs in table → `variant-catalog` + `variants[]`
   - Metric/options without discrete SKUs → `configurable` + `configurationOptions`
3. **Append** to `components` array:

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
  "summary": "Short summary for cards.",
  "specHighlight": "Key spec · second key spec",
  "specs": [{ "label": "Procurement", "value": "Request Technical Quote" }],
  "body": "Full plain text writeup.",
  "image": "assets/products/my-component/primary.png",
  "tags": ["my component", "opto-mechanics"],
  "writeupPath": null,
  "category": "opto-mechanics",
  "categoryLabel": "Opto-Mechanics",
  "categoryPath": "/components/opto-mechanics.html",
  "_search": ""
}
```

4. **Regenerate `_search`**.
5. **Update** `counts.components` and `updated`.
6. Run `npm run build:site`.

**Detail URL after build:** `product.html?id=my-component`

---

# LLM instructions: update or remove catalog items

## Update

- Find object by `id` in `solutions` or `components`.
- Edit fields; **always refresh `_search`** if name, summary, body, tags, sku, or category changed.
- Do not change `id` unless you intend to break old URLs (requires redirect).
- Run `npm run build:site`.

## Remove

- Remove object from array.
- Update `counts`.
- Run `npm run build:site` (orphan `solutions/{id}.html` is overwritten only on rebuild; stale files may remain until clean build — delete `solutions/{id}.html` manually if needed).

## Reorder

- Array order affects: carousel eligibility order, hardware strip, category grid order, hub card order within group.

---

# LLM instructions: add or update a blog article

Knowledge Center articles use **`data/knowledge.json`**, not `catalog.json`.

## Add new article

1. Read `data/knowledge.json`.
2. Ensure `categories` includes the article’s category (`slug` + `label`).
3. **Choose unique `id`** (slug from title).
4. Append to `articles`:

```json
{
  "id": "new-article-slug",
  "title": "Article Title",
  "summary": "Plain-text teaser for hub cards, under ~130 characters.",
  "published": "2026-07-01",
  "modified": "2026-07-01",
  "category": "lenses",
  "categoryLabel": "Lenses",
  "tags": ["relevant", "tags"],
  "legacyUrl": null,
  "legacyId": null,
  "body": "<p>HTML content. Use <h2>, <p>, <table>, <img> as needed.</p>"
}
```

5. **Images in body:**
   - Prefer site-relative: `../../assets/...` or hosted URL
   - First `<img src="...">` in body becomes the hub card thumbnail
6. **Internal links:**
   - Contact: `../../company/contact.html`
   - Other articles: `other-article-slug.html` (same knowledge folder)
   - Components: `../../components/optics.html`
7. Update root `updated` date in `knowledge.json`.
8. Run `npm run build:site`.

**Published URL:** `engineering/knowledge/{id}.html`

## Update existing article

- Find by `id` in `articles`.
- Edit `title`, `summary`, `body`, `modified` date.
- Run `npm run build:site`.

## Bulk import from WordPress

If migrating from live site:

```powershell
npm run migrate-knowledge
npm run build:site
```

This **replaces** `knowledge.json` from the WordPress API. Manual edits will be lost unless merged afterward.

---

# LLM checklist (before finishing)

- [ ] Valid JSON (no trailing commas)
- [ ] Unique `id` and `sku` within catalog
- [ ] Correct `type` (`solution` vs `component`)
- [ ] Solutions have `solutionGroup`; components have `category` + `categoryLabel`
- [ ] `_search` regenerated for every new/changed catalog item
- [ ] `image` path matches file under `assets/products/{id}/` if image used
- [ ] `counts` and `updated` bumped
- [ ] Did **not** run full `npm run build` / `ingest` after manual catalog edit
- [ ] User instructed to run `npm run build:site` and push to `main` for deploy
- [ ] Knowledge articles edited in `knowledge.json`, not `catalog.json`

---

# Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Change to catalog not on live site | No rebuild/deploy | `npm run build:site` + push; check GitHub Action |
| Product missing in search | Stale/missing `_search` | Regenerate `_search` field |
| Carousel slide wrong | Not in top 5 `quantum-setups` | Reorder or change `solutionGroup` |
| Field reverts on build | `patch-solutions-catalog.mjs` | Edit patch script or align data |
| Catalog edits lost | Ran `npm run ingest` | Restore from git; use `build:site` only |
| Component 404 on detail | Build not run | `build:site`; use `product.html?id=` |
| Blog not updating | Edited wrong file | Use `knowledge.json` + `build:site` |

---

# File locations (repo root: `sciengtech-revamp/`)

```
data/
  catalog.json          ← product catalog (source of truth)
  knowledge.json        ← blog / Knowledge Center
  products.json         ← generated (legacy; runtime uses catalog.json)
  search-index.json     ← generated (search)
assets/
  products/{id}/        ← product photos
  slides/               ← homepage placeholder SVGs
scripts/
  build-site.mjs        ← HTML generator
  patch-solutions-catalog.mjs
  ingest-writeup.mjs    ← docx → catalog (destructive to manual edits)
  migrate-knowledge.mjs ← WordPress → knowledge.json
.github/workflows/
  deploy-pages.yml      ← CI: build:site + GitHub Pages
```
