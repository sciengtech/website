import { lazy, Suspense, useState } from 'react';
import type { CatalogProduct } from '@shared/types';
import {
  CATEGORIES,
  PAGE_TEMPLATES,
  SOLUTION_GROUPS,
  categoryMeta,
  solutionGroupLabel,
} from '@/lib/catalog-meta';
import { StringListEditor } from './StringListEditor';
import {
  CustomTableEditor,
  customTableFromProduct,
  customTableHasContent,
} from './CustomTableEditor';
import { ImageManager } from './ImageManager';
import { TagsInput } from './TagsInput';
import { ConfigurationOptionsEditor } from './ConfigurationOptionsEditor';
import { RfqSectionsEditor } from './RfqSectionsEditor';
import { VariantCatalogEditor } from './VariantCatalogEditor';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';

const RichTextEditor = lazy(() =>
  import('./RichTextEditor').then((m) => ({ default: m.RichTextEditor })),
);

export function ProductForm({
  product,
  isNew,
  onSave,
  onCancel,
}: {
  product: CatalogProduct;
  isNew?: boolean;
  onSave: (p: CatalogProduct) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    ...product,
    images: product.images || [],
    customTable: customTableFromProduct(product),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCustomTable, setShowCustomTable] = useState(
    () => customTableHasContent(product.customTable) || Boolean(product.techSpecs?.length),
  );

  function set<K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const id = String(draft.id || '').trim();
      if (!id) throw new Error('Product ID is required');
      if (!String(draft.name || '').trim()) throw new Error('Product name is required');

      const table = customTableFromProduct(draft);
      const hasTable = customTableHasContent(table);
      const next: CatalogProduct = {
        ...draft,
        id,
        images: draft.images || [],
        customTable: hasTable
          ? {
              title: table.title || null,
              columns: table.columns,
              rows: table.rows.filter((row) => row.some((cell) => String(cell || '').trim())),
            }
          : null,
        // Avoid duplicate legacy 2-col render once flexible table is in use
        techSpecs: hasTable ? [] : draft.techSpecs || [],
        keyValueSpecs: hasTable ? [] : draft.keyValueSpecs || [],
        specTableTitle: hasTable ? table.title || null : draft.specTableTitle || null,
      };
      await onSave(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[ProductForm] save failed', err);
    } finally {
      setSaving(false);
    }
  }

  const isSolution = draft.type === 'solution';
  const isRichPage = draft.pageTemplate === 'rich-page';

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className={isRichPage ? 'grid gap-6 lg:grid-cols-2' : 'space-y-6'}
    >
      <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>ID</Label>
          <Input
            autoComplete="off"
            value={draft.id}
            disabled={!isNew}
            onChange={(e) => set('id', e.target.value)}
          />
        </div>
        <div>
          <Label>SKU</Label>
          <Input autoComplete="off" value={draft.sku} onChange={(e) => set('sku', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Name</Label>
          <Input
            autoComplete="off"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <Label>Page template</Label>
          <select
            className="w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
            value={draft.pageTemplate}
            onChange={(e) => {
              const tpl = e.target.value as CatalogProduct['pageTemplate'];
              setDraft((d) => ({
                ...d,
                pageTemplate: tpl,
                ...(tpl === 'rich-page' && d.htmlBody === undefined ? { htmlBody: '' } : {}),
              }));
            }}
          >
            {PAGE_TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Sort index</Label>
          <Input
            type="number"
            min={1}
            step={1}
            autoComplete="off"
            placeholder="e.g. 1 = first on category page"
            value={draft.sortIndex ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              set('sortIndex', v === '' ? null : Number(v));
            }}
          />
          <p className="mt-1 text-xs text-slate-500">
            Lower numbers appear first on the live category page. Or drag rows in the list (Manual order).
          </p>
        </div>
        {isSolution ? (
          <div>
            <Label>Solution group</Label>
            <select
              className="w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
              value={draft.solutionGroup || ''}
              onChange={(e) => {
                const slug = e.target.value;
                set('solutionGroup', slug);
                set('categoryLabel', solutionGroupLabel(slug));
                set('solutionUrl', `solutions/${draft.id}.html`);
              }}
            >
              {SOLUTION_GROUPS.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <Label>Category</Label>
            <select
              className="w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
              value={draft.category || ''}
              onChange={(e) => {
                const meta = categoryMeta(e.target.value);
                set('category', e.target.value);
                set('categoryLabel', meta?.label || '');
                set('categoryPath', meta?.path || '');
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <Label>Summary</Label>
        <Textarea rows={2} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
        {isRichPage && (
          <p className="mt-1 text-xs text-slate-500">Used on catalog cards and search — not shown in the page body.</p>
        )}
      </div>
      {!isRichPage && (
        <div>
          <Label>Spec highlight</Label>
          <Textarea rows={2} value={draft.specHighlight} onChange={(e) => set('specHighlight', e.target.value)} />
        </div>
      )}
      <div>
        <Label>Tags (comma-separated)</Label>
        <TagsInput value={draft.tags} onChange={(tags) => set('tags', tags)} />
      </div>

      {!isRichPage && (
        <>
          <StringListEditor label="Overview" items={draft.overview} onChange={(v) => set('overview', v)} />
          <StringListEditor label="Features" items={draft.features} onChange={(v) => set('features', v)} />
          <StringListEditor label="Applications" items={draft.applications} onChange={(v) => set('applications', v)} />
        </>
      )}

      {isRichPage && (
        <div>
          <Label>Page content (HTML)</Label>
          <p className="mb-2 text-xs text-slate-500">
            WordPress-style editor — fonts, colors, links, lists, tables, and images. Content appears below the product name and SKU on the live page.
          </p>
          <Suspense fallback={<p className="text-sm text-slate-500">Loading editor…</p>}>
            <RichTextEditor
              value={draft.htmlBody || ''}
              onChange={(html) => set('htmlBody', html)}
            />
          </Suspense>
        </div>
      )}

      <div className="space-y-3 rounded-md border border-[#2a3142] bg-[#0e1118] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label>Custom table</Label>
            <p className="text-xs text-slate-500">Optional multi-column table on the product page.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => setShowCustomTable((v) => !v)}>
            {showCustomTable ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showCustomTable && (
          <CustomTableEditor
            table={draft.customTable || customTableFromProduct(draft)}
            defaultTitlePlaceholder={
              draft.pageTemplate === 'variant-catalog'
                ? 'TECHNICAL SPECIFICATIONS'
                : 'SPECIFICATION SHEET'
            }
            onChange={(table) => set('customTable', table)}
          />
        )}
      </div>

      {draft.pageTemplate === 'solution' && draft.solutionContent && (
        <>
          <StringListEditor
            label="Demonstrates"
            items={draft.solutionContent.demonstrates}
            onChange={(v) => set('solutionContent', { ...draft.solutionContent!, demonstrates: v })}
          />
          <StringListEditor
            label="Kit includes"
            items={draft.solutionContent.kitIncludes}
            onChange={(v) => set('solutionContent', { ...draft.solutionContent!, kitIncludes: v })}
          />
          <StringListEditor
            label="Capabilities"
            items={draft.solutionContent.capabilities}
            onChange={(v) => set('solutionContent', { ...draft.solutionContent!, capabilities: v })}
          />
        </>
      )}

      {draft.pageTemplate === 'variant-catalog' && (
        <>
          <div>
            <Label>Product images</Label>
            <p className="mb-2 text-xs text-slate-500">
              Upload images here first, then assign them to variant rows below.
            </p>
            <ImageManager
              productId={draft.id}
              image={draft.image}
              images={draft.images}
              isNew={isNew}
              onChange={({ image, images, removedPath }) => {
                setDraft((d) => ({
                  ...d,
                  image,
                  ...(images !== undefined ? { images } : {}),
                  ...(removedPath && d.variants
                    ? {
                        variants: d.variants.map((v) =>
                          v.image === removedPath ? { ...v, image: undefined } : v,
                        ),
                      }
                    : {}),
                }));
              }}
            />
          </div>
          <div>
            <Label>Variants</Label>
            <VariantCatalogEditor
              productId={draft.id}
              image={draft.image}
              images={draft.images}
              variants={draft.variants}
              onChange={(variants) => set('variants', variants)}
            />
          </div>
        </>
      )}

      {draft.pageTemplate === 'configurable' && (
        <>
          <ConfigurationOptionsEditor
            productId={draft.id}
            value={draft.configurationOptions}
            onChange={(configurationOptions) => set('configurationOptions', configurationOptions)}
          />
          <RfqSectionsEditor
            productId={draft.id}
            value={draft.rfqSections}
            onChange={(rfqSections) => set('rfqSections', rfqSections)}
          />
        </>
      )}

      {draft.pageTemplate !== 'variant-catalog' && (
        <div>
          <ImageManager
            productId={draft.id}
            image={draft.image}
            images={draft.images}
            isNew={isNew}
            onChange={({ image, images, removedPath }) => {
              setDraft((d) => ({
                ...d,
                image,
                ...(images !== undefined ? { images } : {}),
                ...(removedPath && d.variants
                  ? {
                      variants: d.variants.map((v) =>
                        v.image === removedPath ? { ...v, image: undefined } : v,
                      ),
                    }
                  : {}),
              }));
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save locally'}
        </Button>
        <Button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Delete ${draft.name}?`)) return;
              try {
                await window.siteEditor.catalog.remove(draft.id, draft.type);
                onCancel();
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>
      </div>

      {isRichPage && (
        <div>
          <Label>Preview</Label>
          <div className="mb-3 rounded-md border border-[#2a3142] bg-[#161b26] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{draft.categoryLabel || 'Component'}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-100">{draft.name || 'Product name'}</h2>
            <p className="mt-1 font-mono text-sm text-slate-400">SKU: {draft.sku || '—'}</p>
          </div>
          <div
            className="knowledge-prose rounded-md border border-[#2a3142] bg-[#161b26] p-4 min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: draft.htmlBody || '<p class="text-slate-500">Start typing to preview…</p>' }}
          />
        </div>
      )}
    </form>
  );
}
