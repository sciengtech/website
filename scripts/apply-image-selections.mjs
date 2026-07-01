/**
 * Apply data/image-selections.json — copy all writeup images to assets/products/
 * and update catalog JSON (primary + images gallery).
 * Run: node scripts/apply-image-selections.mjs && node scripts/build-site.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { solutionGroupLabel } from './solution-groups.mjs';
import { patchSolutionsCatalog } from './patch-solutions-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const MANAGED_IMAGE_RE = /^(primary|image-\d+)\./i;

function makeSearch(p) {
  return [
    p.id, p.sku, p.name, p.type, p.category, p.categoryLabel,
    p.summary, p.specHighlight, (p.tags || []).join(' '),
    (p.specs || []).map((s) => `${s.label} ${s.value}`).join(' '),
    p.body || '',
  ].join(' ').toLowerCase();
}

function normalizeWriteupPath(rel) {
  return String(rel || '')
    .replace(/\\/g, '/')
    .replace(/^Webpage_Writeup\//, '')
    .trim();
}

function buildCatalogLookups(catalog) {
  const byId = new Map();
  const byWriteupPath = new Map();
  for (const item of [...catalog.solutions, ...catalog.components]) {
    byId.set(item.id, item);
    if (item.writeupPath) {
      byWriteupPath.set(normalizeWriteupPath(item.writeupPath), item);
    }
  }
  return { byId, byWriteupPath };
}

function loadManifest() {
  const manifestPath = path.join(ROOT, 'assets/imported/writeup/manifest.json');
  if (!fs.existsSync(manifestPath)) return new Map();
  const list = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return new Map(list.map((m) => [m.id, m]));
}

function resolveCatalogId(selection, manifestById, lookups) {
  if (lookups.byId.has(selection.id)) return selection.id;

  const manifest = manifestById.get(selection.id);
  if (manifest?.writeupPath) {
    const writeupPath = normalizeWriteupPath(manifest.writeupPath.split(';')[0].trim());
    const match = lookups.byWriteupPath.get(writeupPath);
    if (match) return match.id;
  }

  return null;
}

function writeupSourceDir(selection) {
  const fromId = path.join(ROOT, 'assets/imported/writeup', selection.id);
  if (fs.existsSync(fromId)) return fromId;
  if (selection.path) {
    const fromPath = path.dirname(path.join(ROOT, selection.path.replace(/\//g, path.sep)));
    if (fs.existsSync(fromPath)) return fromPath;
  }
  return null;
}

function clearManagedImages(destDir) {
  if (!fs.existsSync(destDir)) return;
  for (const file of fs.readdirSync(destDir)) {
    if (MANAGED_IMAGE_RE.test(file)) {
      fs.unlinkSync(path.join(destDir, file));
    }
  }
}

function copyProductImages(selection, catalogId) {
  const srcDir = writeupSourceDir(selection);
  if (!srcDir) {
    console.warn('  missing writeup folder for', selection.id);
    return null;
  }

  const primaryFile = selection.image;
  if (!primaryFile) {
    console.warn('  no primary image for', selection.id);
    return null;
  }

  const primarySrc = path.join(srcDir, primaryFile);
  if (!fs.existsSync(primarySrc)) {
    console.warn('  missing primary file:', primarySrc);
    return null;
  }

  const destDir = path.join(ROOT, 'assets/products', catalogId);
  fs.mkdirSync(destDir, { recursive: true });
  clearManagedImages(destDir);

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => IMAGE_RE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const images = [];
  const primaryExt = path.extname(primaryFile).toLowerCase();
  const primaryDest = `primary${primaryExt}`;
  fs.copyFileSync(primarySrc, path.join(destDir, primaryDest));
  images.push(`assets/products/${catalogId}/${primaryDest}`);

  let n = 2;
  for (const file of files) {
    if (file === primaryFile) continue;
    const ext = path.extname(file).toLowerCase();
    const destName = `image-${String(n).padStart(2, '0')}${ext}`;
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, destName));
    images.push(`assets/products/${catalogId}/${destName}`);
    n += 1;
  }

  return { image: images[0], images };
}

const payload = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/image-selections.json'), 'utf8')
);
const selections = payload.selections.filter((s) => s.decision === 'use' && s.image);
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const manifestById = loadManifest();
const lookups = buildCatalogLookups(catalog);
const resolvedByCatalogId = new Map();

for (const selection of selections) {
  const catalogId = resolveCatalogId(selection, manifestById, lookups);
  if (!catalogId) {
    console.warn('No catalog match for selection:', selection.id);
    continue;
  }
  const assets = copyProductImages(selection, catalogId);
  if (assets) {
    resolvedByCatalogId.set(catalogId, assets);
    console.log(
      `  applied ${catalogId} (${selection.id}) -> primary + ${assets.images.length - 1} extra`
    );
  }
}

function applyToItem(item) {
  const assets = resolvedByCatalogId.get(item.id);
  if (!assets) return item;
  item.image = assets.image;
  item.images = assets.images;
  item._search = makeSearch(item);
  return item;
}

catalog.solutions = catalog.solutions.map(applyToItem);
catalog.components = catalog.components.map(applyToItem);
patchSolutionsCatalog(catalog);

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'data/catalog.json'), JSON.stringify(catalog, null, 2));

const products = {
  version: catalog.version,
  updated: catalog.updated,
  count: catalog.components.length,
  products: catalog.components,
};
fs.writeFileSync(path.join(ROOT, 'data/products.json'), JSON.stringify(products, null, 2));

const searchIndex = {
  version: catalog.version,
  updated: catalog.updated,
  items: [...catalog.solutions, ...catalog.components].map((p) => ({
    id: p.id,
    type: p.type,
    name: p.name,
    sku: p.sku,
    category: p.category || p.solutionGroup,
    categoryLabel:
      p.categoryLabel ||
      (p.solutionGroup ? solutionGroupLabel(p.solutionGroup) : undefined),
    specHighlight: p.specHighlight,
    image: p.image,
    url: p.solutionUrl || `product.html#${encodeURIComponent(p.id)}`,
    _search: p._search,
    featured: p.type === 'solution',
  })),
};
fs.writeFileSync(path.join(ROOT, 'data/search-index.json'), JSON.stringify(searchIndex, null, 2));

console.log(`Applied ${resolvedByCatalogId.size} image selections.`);
