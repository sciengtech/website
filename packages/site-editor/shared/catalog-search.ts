import type { CatalogProduct } from './types';

function nonEmptyStrings(values: unknown[]): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function specLines(rows: { label: string; value: string }[] | undefined): string[] {
  return (rows || []).map((s) => `${s.label}: ${s.value}`);
}

function stripHtml(html: string | undefined): string {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text blob stored on each product; folded into _search on save. */
export function makeBody(p: CatalogProduct): string {
  const sc = p.solutionContent;
  const solutionParts = sc
    ? nonEmptyStrings([
        sc.tagline,
        ...sc.demonstrates,
        ...sc.kitIncludes,
        ...sc.capabilities,
      ])
    : [];

  const variantText = (p.variants || []).flatMap((v) =>
    Object.values(v)
      .filter((x) => typeof x === 'string')
      .map(String),
  );

  const structuredExtras = [p.configurationOptions, p.rfqSections]
    .filter(Boolean)
    .map((v) => JSON.stringify(v));

  return [
    p.name,
    p.summary,
    p.specHighlight,
    ...(p.aliases || []),
    ...(p.overview || []),
    ...(p.features || []),
    ...(p.applications || []),
    ...specLines(p.specs),
    ...specLines(p.techSpecs),
    ...specLines(p.keyValueSpecs),
    ...variantText,
    ...solutionParts,
    p.customNote,
    stripHtml(p.htmlBody),
    ...(p.tags || []),
    ...structuredExtras,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join('\n\n')
    .trim();
}

/** Mirrors scripts/lib/catalog-search.mjs */
export function makeSearch(p: CatalogProduct): string {
  return [
    p.id,
    p.sku,
    p.name,
    p.type,
    p.category,
    p.categoryLabel,
    p.pageTemplate,
    p.summary,
    p.specHighlight,
    (p.aliases || []).join(' '),
    (p.features || []).join(' '),
    (p.applications || []).join(' '),
    (p.tags || []).join(' '),
    (p.specs || []).map((s) => `${s.label} ${s.value}`).join(' '),
    (p.variants || []).map((v) => Object.values(v).join(' ')).join(' '),
    p.body || '',
  ]
    .join(' ')
    .toLowerCase();
}
