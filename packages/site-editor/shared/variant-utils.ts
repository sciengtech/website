import type { CatalogVariant } from './types';

export const VARIANT_RESERVED_KEYS = new Set([
  'sr',
  'sku',
  'product_code',
  'set_code',
  'image',
]);

export function formatVariantColumnLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugifyColumnKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function variantAttributeKeys(variants: CatalogVariant[]): string[] {
  const keys = new Set<string>();
  for (const row of variants) {
    for (const key of Object.keys(row)) {
      if (!VARIANT_RESERVED_KEYS.has(key)) keys.add(key);
    }
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

export function renumberVariants(variants: CatalogVariant[]): CatalogVariant[] {
  return variants.map((row, index) => ({ ...row, sr: index + 1 }));
}

export function emptyVariantRow(attributeKeys: string[], sr: number): CatalogVariant {
  const row: CatalogVariant = { sr, product_code: '', sku: '' };
  for (const key of attributeKeys) row[key] = '';
  return row;
}

export function toCatalogVariants(raw: Record<string, unknown>[]): CatalogVariant[] {
  return raw.map((row, index) => {
    const productCode = String(row.product_code ?? row.set_code ?? row.sku ?? '');
    const variant: CatalogVariant = {
      sr: Number(row.sr) || index + 1,
      sku: String(row.sku ?? productCode),
      product_code: productCode,
    };
    if (row.image) variant.image = String(row.image);
    if (row.set_code) variant.set_code = String(row.set_code);
    for (const [key, value] of Object.entries(row)) {
      if (VARIANT_RESERVED_KEYS.has(key)) continue;
      variant[key] = value == null ? '' : String(value);
    }
    return variant;
  });
}

export function fromCatalogVariants(variants: CatalogVariant[]): Record<string, unknown>[] {
  return variants.map((row) => {
    const out: Record<string, unknown> = { sr: row.sr };
    const productCode = row.product_code?.trim() || '';
    const sku = row.sku?.trim() || productCode;

    if (productCode) out.product_code = productCode;
    if (sku) out.sku = sku;
    if (row.set_code?.trim()) out.set_code = row.set_code.trim();
    if (row.image?.trim()) out.image = row.image.trim();

    for (const [key, value] of Object.entries(row)) {
      if (VARIANT_RESERVED_KEYS.has(key)) continue;
      if (value !== '' && value != null) out[key] = value;
    }

    if (!out.sku && out.product_code) out.sku = out.product_code;
    return out;
  });
}

export function filenameFromAssetPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}
