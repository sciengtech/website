import { useEffect, useMemo, useState } from 'react';
import type { CatalogVariant } from '@shared/types';
import {
  emptyVariantRow,
  filenameFromAssetPath,
  formatVariantColumnLabel,
  fromCatalogVariants,
  renumberVariants,
  slugifyColumnKey,
  toCatalogVariants,
  variantAttributeKeys,
} from '@shared/variant-utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

export function VariantCatalogEditor({
  productId,
  image,
  images = [],
  variants,
  onChange,
}: {
  productId: string;
  image: string | null;
  images?: string[];
  variants: Record<string, unknown>[];
  onChange: (variants: Record<string, unknown>[]) => void;
}) {
  const [rows, setRows] = useState<CatalogVariant[]>(() => toCatalogVariants(variants));
  const [columnKeys, setColumnKeys] = useState<string[]>(() =>
    variantAttributeKeys(toCatalogVariants(variants)),
  );
  const [newColumn, setNewColumn] = useState('');
  const [columnError, setColumnError] = useState('');
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const parsed = toCatalogVariants(variants);
    setRows(parsed);
    setColumnKeys(variantAttributeKeys(parsed));
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    async function loadImages() {
      const onDisk = await window.siteEditor.images.listForProduct(productId);
      const paths = [...new Set([image, ...(images || []), ...onDisk].filter(Boolean))] as string[];
      const entries = await Promise.all(
        paths.map(async (p) => {
          const url = await window.siteEditor.images.getPreviewUrl(p);
          return [p, url || ''] as const;
        }),
      );
      if (!cancelled) {
        setAvailableImages(paths);
        setPreviews(Object.fromEntries(entries));
      }
    }
    loadImages();
    return () => {
      cancelled = true;
    };
  }, [productId, image, images]);

  const emit = (nextRows: CatalogVariant[], nextColumnKeys = columnKeys) => {
    const normalized = renumberVariants(
      nextRows.map((row) => {
        const copy: CatalogVariant = { ...row };
        for (const key of nextColumnKeys) {
          if (copy[key] == null) copy[key] = '';
        }
        return copy;
      }),
    );
    setRows(normalized);
    onChange(fromCatalogVariants(normalized));
  };

  const updateRow = (index: number, patch: Partial<CatalogVariant>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    emit(next);
  };

  const updateAttribute = (index: number, key: string, value: string) => {
    updateRow(index, { [key]: value });
  };

  const addRow = () => {
    emit([...rows, emptyVariantRow(columnKeys, rows.length + 1)]);
  };

  const removeRow = (index: number) => {
    emit(rows.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const key = slugifyColumnKey(newColumn);
    if (!key) {
      setColumnError('Enter a column name (e.g. angle, length mm).');
      return;
    }
    if (columnKeys.includes(key) || ['sr', 'sku', 'product_code', 'image'].includes(key)) {
      setColumnError('That column already exists.');
      return;
    }
    setColumnError('');
    const nextKeys = [...columnKeys, key].sort((a, b) => a.localeCompare(b));
    setColumnKeys(nextKeys);
    setNewColumn('');
    emit(
      rows.map((row) => ({ ...row, [key]: row[key] ?? '' })),
      nextKeys,
    );
  };

  const removeColumn = (key: string) => {
    const nextKeys = columnKeys.filter((k) => k !== key);
    setColumnKeys(nextKeys);
    emit(
      rows.map((row) => {
        const copy = { ...row };
        delete copy[key];
        return copy;
      }),
      nextKeys,
    );
  };

  const usedImages = useMemo(
    () => new Set(rows.map((r) => r.image).filter(Boolean) as string[]),
    [rows],
  );

  return (
    <div className="space-y-4 rounded-lg border border-[#2a3142] bg-[#0e1118] p-4">
      <div>
        <Label>Variant table columns</Label>
        <p className="mt-1 text-xs text-slate-500">
          Add columns for configuration attributes (angle, length, shape, etc.). SKU and image are
          set per row below.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {columnKeys.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-[#2a3142] bg-[#161b26] px-3 py-1 text-xs text-slate-200"
            >
              {formatVariantColumnLabel(key)}
              <button
                type="button"
                className="text-slate-500 hover:text-red-400"
                onClick={() => removeColumn(key)}
                aria-label={`Remove ${key} column`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <Input
              placeholder="New column (e.g. angle)"
              value={newColumn}
              onChange={(e) => {
                setNewColumn(e.target.value);
                setColumnError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addColumn();
                }
              }}
            />
          </div>
          <Button type="button" onClick={addColumn}>
            Add column
          </Button>
        </div>
        {columnError && <p className="mt-1 text-xs text-red-400">{columnError}</p>}
      </div>

      {availableImages.length === 0 && (
        <p className="text-xs text-amber-400/90">
          Upload product images below first, then map them to each variant row.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-2 w-10">#</th>
              {columnKeys.map((key) => (
                <th key={key} className="p-2">
                  {formatVariantColumnLabel(key)}
                </th>
              ))}
              <th className="p-2">Product code</th>
              <th className="p-2">SKU</th>
              <th className="p-2 min-w-[10rem]">Image</th>
              <th className="p-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.sr} className="border-t border-[#2a3142] align-top">
                <td className="p-2 text-slate-400">{index + 1}</td>
                {columnKeys.map((key) => (
                  <td key={key} className="p-2">
                    <Input
                      value={String(row[key] ?? '')}
                      onChange={(e) => updateAttribute(index, key, e.target.value)}
                    />
                  </td>
                ))}
                <td className="p-2">
                  <Input
                    value={row.product_code || ''}
                    onChange={(e) => {
                      const productCode = e.target.value;
                      const patch: Partial<CatalogVariant> = { product_code: productCode };
                      if (!row.sku || row.sku === row.product_code) {
                        patch.sku = productCode;
                      }
                      updateRow(index, patch);
                    }}
                  />
                </td>
                <td className="p-2">
                  <Input
                    className="font-mono text-xs"
                    value={row.sku || ''}
                    onChange={(e) => updateRow(index, { sku: e.target.value })}
                  />
                </td>
                <td className="p-2">
                  <div className="space-y-2">
                    <select
                      className="w-full rounded-md border border-[#2a3142] bg-[#161b26] px-2 py-2 text-xs"
                      value={row.image || ''}
                      onChange={(e) =>
                        updateRow(index, { image: e.target.value || undefined })
                      }
                    >
                      <option value="">No image</option>
                      {availableImages.map((path) => (
                        <option key={path} value={path}>
                          {filenameFromAssetPath(path)}
                          {usedImages.has(path) && path !== row.image ? ' (in use)' : ''}
                        </option>
                      ))}
                    </select>
                    {row.image && previews[row.image] && (
                      <img
                        src={previews[row.image]}
                        alt=""
                        className="h-14 w-full rounded border border-[#2a3142] object-contain bg-black"
                      />
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <Button type="button" variant="ghost" onClick={() => removeRow(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" onClick={addRow}>
        + Add variant row
      </Button>
    </div>
  );
}
