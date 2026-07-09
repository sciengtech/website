import { useState } from 'react';
import type { CatalogProduct } from '@shared/types';
import {
  CATEGORIES,
  PAGE_TEMPLATES,
  SOLUTION_GROUPS,
  categoryMeta,
  solutionGroupLabel,
} from '@/lib/catalog-meta';
import { StringListEditor } from './StringListEditor';
import { ImageManager } from './ImageManager';
import { VariantCatalogEditor } from './VariantCatalogEditor';
import { RichTextEditor } from './RichTextEditor';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';

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
  const [draft, setDraft] = useState(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const isSolution = draft.type === 'solution';
  const isRichPage = draft.pageTemplate === 'rich-page';

  return (
    <form onSubmit={handleSubmit} className={isRichPage ? 'grid gap-6 lg:grid-cols-2' : 'space-y-6'}>
      <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>ID</Label>
          <Input value={draft.id} disabled={!isNew} onChange={(e) => set('id', e.target.value)} />
        </div>
        <div>
          <Label>SKU</Label>
          <Input value={draft.sku} onChange={(e) => set('sku', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Name</Label>
          <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
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
        <Input
          value={draft.tags.join(', ')}
          onChange={(e) =>
            set(
              'tags',
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
        />
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
            Rich text below the product name and SKU on the live page. Links, bold, headings, and lists are supported.
          </p>
          <RichTextEditor
            value={draft.htmlBody || ''}
            onChange={(html) => set('htmlBody', html)}
          />
        </div>
      )}

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
              onChange={({ image, images }) => {
                set('image', image);
                if (images) set('images', images);
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
          <div>
            <Label>Configuration options (JSON)</Label>
            <Textarea
              rows={6}
              value={JSON.stringify(draft.configurationOptions, null, 2)}
              onChange={(e) => {
                try {
                  set('configurationOptions', JSON.parse(e.target.value));
                } catch {
                  /* ignore */
                }
              }}
            />
          </div>
          <div>
            <Label>RFQ sections (JSON)</Label>
            <Textarea
              rows={6}
              value={JSON.stringify(draft.rfqSections, null, 2)}
              onChange={(e) => {
                try {
                  set('rfqSections', JSON.parse(e.target.value));
                } catch {
                  /* ignore */
                }
              }}
            />
          </div>
        </>
      )}

      {draft.pageTemplate !== 'variant-catalog' && (
        <div>
          <ImageManager
            productId={draft.id}
            image={draft.image}
            images={draft.images}
            onChange={({ image, images }) => {
              set('image', image);
              if (images) set('images', images);
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save locally'}
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Delete ${draft.name}?`)) return;
              await window.siteEditor.catalog.remove(draft.id, draft.type);
              onCancel();
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
