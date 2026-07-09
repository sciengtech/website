import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AuthStatus,
  CatalogData,
  CatalogProduct,
  KnowledgeArticle,
  KnowledgeData,
  PageTemplate,
  ProductType,
} from '@shared/types';
import { LoginPage } from './pages/LoginPage';
import { ProductForm } from './components/ProductForm';
import { ArticleForm } from './components/ArticleForm';
import { PublishBar } from './components/PublishBar';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { scaffoldProduct } from './lib/product-factory';
import { slugify } from './lib/catalog-meta';
import { PAGE_TEMPLATES } from './lib/catalog-meta';

type Tab = 'components' | 'solutions' | 'knowledge';
type View =
  | { kind: 'list' }
  | { kind: 'edit-product'; product: CatalogProduct; isNew?: boolean }
  | { kind: 'edit-article'; article: KnowledgeArticle; isNew?: boolean }
  | { kind: 'new-product-wizard' };

export function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [tab, setTab] = useState<Tab>('components');
  const [view, setView] = useState<View>({ kind: 'list' });
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeData | null>(null);
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [pageTemplateFilter, setPageTemplateFilter] = useState<
    'all' | PageTemplate
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [sortKey, setSortKey] = useState<
    'name' | 'sku' | 'pageTemplate' | 'category'
  >('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    sku: true,
    template: true,
    category: true,
  });
  const [wizard, setWizard] = useState({
    type: 'component' as ProductType,
    name: '',
    pageTemplate: 'component' as PageTemplate,
    category: 'opto-mechanics',
    solutionGroup: 'quantum-setups',
  });

  const loadData = useCallback(async () => {
    const [c, k] = await Promise.all([
      window.siteEditor.catalog.load(),
      window.siteEditor.knowledge.load(),
    ]);
    setCatalog(c);
    setKnowledge(k);
  }, []);

  useEffect(() => {
    window.siteEditor.auth.getStatus().then(async (status) => {
      setAuth(status);
      if (status.loggedIn) {
        try {
          await window.siteEditor.workspace.sync();
          await loadData();
        } catch {
          /* workspace may not exist yet */
        }
      }
    });
  }, [loadData]);

  async function handleSync() {
    setSyncing(true);
    try {
      await window.siteEditor.workspace.sync();
      await loadData();
      setView({ kind: 'list' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    await window.siteEditor.auth.logout();
    setAuth({ loggedIn: false });
    setCatalog(null);
    setKnowledge(null);
    setView({ kind: 'list' });
  }

  const filteredComponents = useMemo(() => {
    if (!catalog) return [];
    const q = query.toLowerCase();
    const base = catalog.components.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
    const filtered = base.filter((p) => {
      if (pageTemplateFilter !== 'all' && p.pageTemplate !== pageTemplateFilter) return false;
      if (categoryFilter !== 'all') {
        const cat = p.categoryLabel || p.category || p.solutionGroup || '';
        if (cat !== categoryFilter) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const av =
        sortKey === 'name'
          ? a.name
          : sortKey === 'sku'
            ? a.sku
            : sortKey === 'pageTemplate'
              ? a.pageTemplate
              : a.categoryLabel || a.category || a.solutionGroup || '';
      const bv =
        sortKey === 'name'
          ? b.name
          : sortKey === 'sku'
            ? b.sku
            : sortKey === 'pageTemplate'
              ? b.pageTemplate
              : b.categoryLabel || b.category || b.solutionGroup || '';
      return dir * String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
    });

    return sorted;
  }, [catalog, query, pageTemplateFilter, categoryFilter, sortDir, sortKey]);

  const filteredSolutions = useMemo(() => {
    if (!catalog) return [];
    const q = query.toLowerCase();
    const base = catalog.solutions.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
    const filtered = base.filter((p) => {
      if (pageTemplateFilter !== 'all' && p.pageTemplate !== pageTemplateFilter) return false;
      if (categoryFilter !== 'all') {
        const cat = p.categoryLabel || p.category || p.solutionGroup || '';
        if (cat !== categoryFilter) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const av =
        sortKey === 'name'
          ? a.name
          : sortKey === 'sku'
            ? a.sku
            : sortKey === 'pageTemplate'
              ? a.pageTemplate
              : a.categoryLabel || a.category || a.solutionGroup || '';
      const bv =
        sortKey === 'name'
          ? b.name
          : sortKey === 'sku'
            ? b.sku
            : sortKey === 'pageTemplate'
              ? b.pageTemplate
              : b.categoryLabel || b.category || b.solutionGroup || '';
      return dir * String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
    });

    return sorted;
  }, [catalog, query, pageTemplateFilter, categoryFilter, sortDir, sortKey]);

  const availableCategories = useMemo(() => {
    if (!catalog) return [];
    const items = tab === 'components' ? catalog.components : catalog.solutions;
    const set = new Set<string>();
    for (const p of items) {
      const cat = p.categoryLabel || p.solutionGroup || p.category || '';
      if (cat) set.add(cat);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  }, [catalog, tab]);

  const filteredArticles = useMemo(() => {
    if (!knowledge) return [];
    const q = query.toLowerCase();
    return knowledge.articles.filter(
      (a) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q),
    );
  }, [knowledge, query]);

  if (!auth?.loggedIn) {
    return (
      <LoginPage
        onLoggedIn={async () => {
          const status = await window.siteEditor.auth.getStatus();
          setAuth(status);
          await loadData();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-[#2a3142] bg-[#0b0f17] p-4">
        <h1 className="mb-1 text-sm font-bold text-[#e11d48]">Site Editor</h1>
        <p className="mb-4 text-xs text-slate-500">@{auth.username}</p>
        <nav className="space-y-1">
          {(['components', 'solutions', 'knowledge'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm capitalize ${
                tab === t ? 'bg-[#e11d48]/20 text-white' : 'text-slate-400 hover:bg-[#161b26]'
              }`}
              onClick={() => {
                setTab(t);
                setView({ kind: 'list' });
              }}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6">
          <Button className="w-full" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync from GitHub'}
          </Button>
          <Button className="w-full" variant="ghost" onClick={handleLogout}>
            Sign out
          </Button>
          <div className="pt-3">
            <PublishBar onPublished={loadData} />
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            className="max-w-sm"
            placeholder="Search name, sku, id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {view.kind === 'list' && tab !== 'knowledge' && (
            <Button variant="primary" onClick={() => setView({ kind: 'new-product-wizard' })}>
              + New {tab === 'components' ? 'component' : 'solution'}
            </Button>
          )}
          {view.kind === 'list' && tab === 'knowledge' && knowledge && (
            <Button
              variant="primary"
              onClick={() =>
                setView({
                  kind: 'edit-article',
                  isNew: true,
                  article: {
                    id: '',
                    title: '',
                    summary: '',
                    published: new Date().toISOString().slice(0, 10),
                    modified: new Date().toISOString().slice(0, 10),
                    category: knowledge.categories[0]?.slug || 'lenses',
                    categoryLabel: knowledge.categories[0]?.label || 'Lenses',
                    tags: [],
                    legacyUrl: null,
                    legacyId: null,
                    body: '<p></p>',
                  },
                })
              }
            >
              + New article
            </Button>
          )}
          {view.kind !== 'list' && (
            <Button onClick={() => setView({ kind: 'list' })}>← Back to list</Button>
          )}
        </div>

        {view.kind === 'list' && tab !== 'knowledge' && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="block text-xs text-slate-500">
              Template
              <select
                className="mt-1 rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
                value={pageTemplateFilter}
                onChange={(e) =>
                  setPageTemplateFilter(
                    e.target.value === 'all' ? 'all' : (e.target.value as PageTemplate),
                  )
                }
              >
                <option value="all">All</option>
                {PAGE_TEMPLATES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-slate-500">
              Category
              <select
                className="mt-1 rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : e.target.value)}
              >
                <option value="all">All</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-slate-500">
              Sort
              <select
                className="mt-1 rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm"
                value={sortKey}
                onChange={(e) =>
                  setSortKey(e.target.value as typeof sortKey)
                }
              >
                <option value="name">Name</option>
                <option value="sku">SKU</option>
                <option value="pageTemplate">Page template</option>
                <option value="category">Category</option>
              </select>
            </label>

            <Button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              variant="ghost"
            >
              {sortDir === 'asc' ? 'Asc' : 'Desc'}
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowColumnPicker((v) => !v)}
              >
                Columns
              </Button>
              {showColumnPicker && (
                <div className="absolute z-10 mt-2 w-64 rounded-lg border border-[#2a3142] bg-[#161b26] p-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Visible columns</div>
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>Name</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns.name}
                      onChange={(e) =>
                        setVisibleColumns((v) => ({ ...v, name: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>SKU</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns.sku}
                      onChange={(e) =>
                        setVisibleColumns((v) => ({ ...v, sku: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>Page template</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns.template}
                      onChange={(e) =>
                        setVisibleColumns((v) => ({ ...v, template: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>Category</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns.category}
                      onChange={(e) =>
                        setVisibleColumns((v) => ({ ...v, category: e.target.checked }))
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {view.kind === 'new-product-wizard' && (
          <div className="max-w-xl space-y-4 rounded-lg border border-[#2a3142] bg-[#161b26] p-6">
            <h2 className="text-lg font-semibold">New product</h2>
            <label className="block text-sm">
              Type
              <select
                className="mt-1 w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2"
                value={wizard.type}
                onChange={(e) =>
                  setWizard((w) => ({
                    ...w,
                    type: e.target.value as ProductType,
                    pageTemplate: e.target.value === 'solution' ? 'solution' : 'component',
                  }))
                }
              >
                <option value="component">Component</option>
                <option value="solution">Solution</option>
              </select>
            </label>
            <label className="block text-sm">
              Name
              <Input
                className="mt-1"
                value={wizard.name}
                onChange={(e) => setWizard((w) => ({ ...w, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Page template
              <select
                className="mt-1 w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2"
                value={wizard.pageTemplate}
                onChange={(e) =>
                  setWizard((w) => ({ ...w, pageTemplate: e.target.value as PageTemplate }))
                }
              >
                {PAGE_TEMPLATES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="primary"
              disabled={!wizard.name.trim()}
              onClick={() => {
                const product = scaffoldProduct(wizard);
                setView({ kind: 'edit-product', product, isNew: true });
              }}
            >
              Continue → id: {slugify(wizard.name || 'item')}
            </Button>
          </div>
        )}

        {view.kind === 'edit-product' && (
          <ProductForm
            product={view.product}
            isNew={view.isNew}
            onCancel={async () => {
              await loadData();
              setView({ kind: 'list' });
            }}
            onSave={async (product) => {
              if (view.isNew) {
                await window.siteEditor.catalog.create(product);
              } else {
                await window.siteEditor.catalog.save(product);
              }
              await loadData();
              setView({ kind: 'list' });
            }}
          />
        )}

        {view.kind === 'edit-article' && knowledge && (
          <ArticleForm
            article={view.article}
            knowledge={knowledge}
            isNew={view.isNew}
            onCancel={async () => {
              await loadData();
              setView({ kind: 'list' });
            }}
            onSave={async (article) => {
              if (view.isNew) {
                await window.siteEditor.knowledge.create(article);
              } else {
                await window.siteEditor.knowledge.save(article);
              }
              await loadData();
              setView({ kind: 'list' });
            }}
          />
        )}

        {view.kind === 'list' && tab === 'components' && (
          <ProductTable
            rows={filteredComponents}
            visibleColumns={visibleColumns}
            onEdit={(p) => setView({ kind: 'edit-product', product: p })}
          />
        )}
        {view.kind === 'list' && tab === 'solutions' && (
          <ProductTable
            rows={filteredSolutions}
            visibleColumns={visibleColumns}
            onEdit={(p) => setView({ kind: 'edit-product', product: p })}
          />
        )}
        {view.kind === 'list' && tab === 'knowledge' && (
          <ArticleTable
            rows={filteredArticles}
            onEdit={(a) => setView({ kind: 'edit-article', article: a })}
          />
        )}
      </main>
    </div>
  );
}

function ProductTable({
  rows,
  visibleColumns,
  onEdit,
}: {
  rows: CatalogProduct[];
  visibleColumns: {
    name: boolean;
    sku: boolean;
    template: boolean;
    category: boolean;
  };
  onEdit: (p: CatalogProduct) => void;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr>
          {visibleColumns.name && <th className="p-2">Name</th>}
          {visibleColumns.sku && <th className="p-2">SKU</th>}
          {visibleColumns.template && <th className="p-2">Page template</th>}
          {visibleColumns.category && <th className="p-2">Category</th>}
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-t border-[#2a3142] hover:bg-[#161b26]">
            {visibleColumns.name && <td className="p-2">{p.name}</td>}
            {visibleColumns.sku && <td className="p-2 font-mono text-xs">{p.sku}</td>}
            {visibleColumns.template && <td className="p-2 text-xs text-slate-200">{p.pageTemplate}</td>}
            {visibleColumns.category && (
              <td className="p-2 text-xs text-slate-200">{p.categoryLabel || p.solutionGroup || p.category}</td>
            )}
            <td className="p-2">
              <Button type="button" onClick={() => onEdit(p)}>
                Edit
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArticleTable({
  rows,
  onEdit,
}: {
  rows: KnowledgeArticle[];
  onEdit: (a: KnowledgeArticle) => void;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr>
          <th className="p-2">Title</th>
          <th className="p-2">Category</th>
          <th className="p-2">Published</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.id} className="border-t border-[#2a3142] hover:bg-[#161b26]">
            <td className="p-2">{a.title}</td>
            <td className="p-2">{a.categoryLabel}</td>
            <td className="p-2">{a.published}</td>
            <td className="p-2">
              <Button type="button" onClick={() => onEdit(a)}>
                Edit
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
