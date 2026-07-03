# Catalog & knowledge field reference

Read this when you need full field details. All paths are relative to the cloned `website` repo root.

## catalog.json top level

```json
{
  "version": 2,
  "updated": "YYYY-MM-DD",
  "solutions": [],
  "components": [],
  "counts": { "solutions": 14, "components": 47 }
}
```

## Component categories

| `category` slug | Category page |
|-----------------|---------------|
| `opto-mechanics` | `components/opto-mechanics.html` |
| `motion-and-positioning` | `components/motion-and-positioning.html` |
| `hardware` | `components/hardware.html` |
| `fibre-optics` | `components/fibre-optics.html` |
| `lasers` | `components/lasers.html` |
| `optics` | `components/optics.html` |
| `lab-accessories` | `components/lab-accessories.html` |

## Solution groups

| `solutionGroup` | Hub page |
|-----------------|----------|
| `quantum-setups` | `solutions/quantum-setups.html` |
| `training-kits` | `solutions/training-kits.html` |
| `state-of-the-art-setups` | `solutions/state-of-the-art-setups.html` |

Homepage carousel: first 5 items in `solutions` where `solutionGroup === "quantum-setups"` (array order matters).

## pageTemplate values

| Template | Use for |
|----------|---------|
| `component` | Standard parts — overview, features, applications, techSpecs table |
| `solution` | Kits — solutionContent demonstrates/kitIncludes/capabilities |
| `configurable` | Quote-driven — overview + rfqSections + configurationOptions |
| `variant-catalog` | One product, many SKUs in variants[] table |

## Key catalog fields

| Field | Notes |
|-------|-------|
| `id` | URL slug; lowercase hyphens; unique |
| `sku` | Product code shown on cards and detail |
| `name` | Display title |
| `type` | `"component"` or `"solution"` |
| `summary` | Card / SEO short text |
| `specHighlight` | Mono line on cards and carousel |
| `body` | Full plain text; feeds `_search` |
| `image` | e.g. `assets/products/{id}/primary.png` |
| `tags` | Extra keywords |
| `_search` | **Required.** Lowercase joined searchable text |
| `writeupPath` | `null` for manual entries |

## solutionContent (solutions with pageTemplate: solution)

```json
"solutionContent": {
  "tagline": null,
  "demonstrates": ["Bullet"],
  "kitIncludes": ["Included item"],
  "capabilities": ["Capability"]
}
```

## rfqSections (configurable)

```json
"rfqSections": [{
  "id": "requirements",
  "title": "Specify Your Requirements",
  "parameters": ["Application goals", "Wavelength range"]
}]
```

## variants (variant-catalog)

Each row needs `sr` (number) and `sku` (or `product_code`). Other keys become table columns.

## knowledge.json article

```json
{
  "id": "slug-from-title",
  "title": "Title",
  "summary": "~130 char plain text teaser",
  "published": "YYYY-MM-DD",
  "modified": "YYYY-MM-DD",
  "category": "lenses",
  "categoryLabel": "Lenses",
  "tags": [],
  "legacyUrl": null,
  "legacyId": null,
  "body": "<p>HTML</p>"
}
```

Published URL: `engineering/knowledge/{id}.html`

## Build commands

| Command | When |
|---------|------|
| `npm run build:site` | **Always** after manual JSON edits |
| `npm run build` | **Never** for manual edits — runs docx ingest |
| `npm run ingest` | **Never** for manual edits — overwrites catalog |

## Post-build patch file

`scripts/patch-solutions-catalog.mjs` may override specific solution fields on every build. Check it if values revert unexpectedly.
