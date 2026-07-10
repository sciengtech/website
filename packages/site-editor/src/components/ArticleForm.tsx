import { useState } from 'react';
import type { KnowledgeArticle, KnowledgeData } from '@shared/types';
import { RichTextEditor } from './RichTextEditor';
import { TagsInput } from './TagsInput';
import { ImageManager } from './ImageManager';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';

export function ArticleForm({
  article,
  knowledge,
  isNew,
  onSave,
  onCancel,
}: {
  article: KnowledgeArticle;
  knowledge: KnowledgeData;
  isNew?: boolean;
  onSave: (a: KnowledgeArticle) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(article);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof KnowledgeArticle>(key: K, value: KnowledgeArticle[K]) {
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label>ID</Label>
          <Input value={draft.id} disabled={!isNew} onChange={(e) => set('id', e.target.value)} />
        </div>
        <div>
          <Label>Title</Label>
          <Input value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <Label>Summary</Label>
          <Textarea rows={3} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Published</Label>
            <Input type="date" value={draft.published} onChange={(e) => set('published', e.target.value)} />
          </div>
          <div>
            <Label>Modified</Label>
            <Input type="date" value={draft.modified} onChange={(e) => set('modified', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <select
            className="w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
            value={draft.category}
            onChange={(e) => {
              const cat = knowledge.categories.find((c) => c.slug === e.target.value);
              set('category', e.target.value);
              set('categoryLabel', cat?.label || e.target.value);
            }}
          >
            {knowledge.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <TagsInput value={draft.tags} onChange={(tags) => set('tags', tags)} />
        </div>
        <div>
          <Label>Primary image</Label>
          <p className="mb-2 text-xs text-slate-500">
            Shown on Knowledge Center cards and at the top of the article page. Set the article ID first.
          </p>
          <ImageManager
            productId={draft.id}
            image={draft.image ?? null}
            isNew={isNew}
            kind="knowledge"
            onChange={({ image }) => set('image', image)}
          />
        </div>
        <div>
          <Label>Body</Label>
          <RichTextEditor value={draft.body} onChange={(html) => set('body', html)} />
        </div>
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
                if (!window.confirm(`Delete ${draft.title}?`)) return;
                await window.siteEditor.knowledge.remove(draft.id);
                onCancel();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <div>
        <Label>Preview</Label>
        <div
          className="prose prose-invert max-w-none rounded-md border border-[#2a3142] bg-[#161b26] p-4 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: draft.body }}
        />
      </div>
    </form>
  );
}
