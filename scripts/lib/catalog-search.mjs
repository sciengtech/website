/** Shared catalog _search blob generator for ingest + site editor. */
export function makeSearch(p) {
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
