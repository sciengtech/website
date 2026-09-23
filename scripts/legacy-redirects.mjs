/**
 * Legacy WordPress / WooCommerce URL → new static site redirects.
 * Writes physical redirect HTML (works on GitHub Pages) and patches 404.html
 * with an early client-side map for any path we miss.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Manifest folder ids that do not match current catalog ids */
const ID_ALIASES = {
  'breadboard-optomechanical-platform-optical-mounting-board-precision-mounting-boa':
    'breadboard',
  'lens-mount-lens-holder-optical-lens-mount-fixed-lens-holder-lens-housing-opticel':
    'lens-mount',
  'optical-post-optomechanical-support-post-mounting-post-optical-mounting-rod-thre':
    'optical-post',
  'pedestal-post-holder-pedestal-post-mount-fixed-height-post-mount-rigid-post-pede':
    'pedestal-post-holder',
  'spanner-wrench-optic-lock-ring-tool-optic-adjustment-tool': 'spanner-wrench',
  'swivel-base-adapter-swivel-mounting-base': 'swivel-base-adapter',
  'kinematic-mirror-mount-kinematic-optic-mount-precision-mirror-mount-kinematic-ro':
    'kinematic-mirror-mount',
};

/** Path overrides when manifest mapping is wrong or too generic */
const PATH_OVERRIDES = {
  '/our-oem-products-training-kits-supercontinuum-generation-kit':
    'solutions/white-light-supercontinuum-source.html',
  '/our-oem-products-training-kits': 'solutions/training-kits.html',
  '/optics': 'components/optics.html',
  '/cart': 'engineering/rfq.html',
  '/checkout': 'engineering/rfq.html',
  '/my-account': 'engineering/rfq.html',
  '/shop': 'catalog.html',
  '/our-oem-products': 'catalog.html',
  '/product-category/opto-mechanics': 'components/opto-mechanics.html',
  '/product-category/optics': 'components/optics.html',
  '/feed': 'index.html',
};

function normalizePath(pathname) {
  let p = pathname.trim();
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    /* keep */
  }
  p = p.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  // drop trailing slash except root
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.toLowerCase();
}

function resolveCatalogId(rawId, catalog) {
  const alias = ID_ALIASES[rawId] || rawId;
  const all = [...(catalog.solutions || []), ...(catalog.components || [])];
  if (all.some((p) => p.id === alias)) return alias;
  // fuzzy: alias is prefix of an id or vice versa
  const hit = all.find(
    (p) => p.id.startsWith(alias) || alias.startsWith(p.id),
  );
  return hit ? hit.id : alias;
}

function targetForProduct(id, type) {
  if (type === 'solution') return `solutions/${id}.html`;
  return `product.html#${encodeURIComponent(id)}`;
}

function loadManifest(root) {
  const file = path.join(root, 'assets/imported/old-site/manifest.json');
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('  warn: could not read legacy manifest:', err.message);
    return [];
  }
}

/**
 * Build map: normalized path (no trailing slash) → site-relative target
 * e.g. "/product/allen-bolts" → "product.html#allen-bolt"
 */
export function buildRedirectMap(root, catalog) {
  const map = { ...PATH_OVERRIDES };
  const byId = new Map(
    [...(catalog.solutions || []), ...(catalog.components || [])].map((p) => [
      p.id,
      p,
    ]),
  );

  for (const row of loadManifest(root)) {
    const id = resolveCatalogId(row.id, catalog);
    const product = byId.get(id);
    const type = product?.type || row.type || 'component';
    const target = targetForProduct(id, type);
    const pages = String(row.legacyPages || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const page of pages) {
      const p = normalizePath(page);
      if (p === '/' || PATH_OVERRIDES[p]) continue;
      // Prefer more specific existing entries; don't overwrite training-kits hub override
      if (!map[p]) map[p] = target;
    }
  }

  // Also accept /product/{catalog-id} for every component
  for (const p of catalog.components || []) {
    const key = `/product/${p.id}`;
    if (!map[key]) map[key] = targetForProduct(p.id, 'component');
  }
  for (const p of catalog.solutions || []) {
    const key = `/solutions/${p.id}`;
    // solutions/{id}.html already exists; skip
    void key;
  }

  return map;
}

function redirectHtml(absoluteTargetHref) {
  const esc = absoluteTargetHref
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${esc}" />
  <link rel="canonical" href="${esc}" />
  <title>Redirecting…</title>
  <script>location.replace(${JSON.stringify(absoluteTargetHref)});</script>
</head>
<body>
  <p>This page has moved. <a href="${esc}">Continue</a>.</p>
</body>
</html>
`;
}

/**
 * Write index.html under each legacy path folder so /path/ and /path resolve.
 * Uses root-absolute targets (/product.html#id) so depth doesn't matter.
 */
function writeStaticRedirects(root, map) {
  let count = 0;
  for (const [pathname, target] of Object.entries(map)) {
    if (pathname === '/') continue;
    const absTarget = target.startsWith('/') ? target : `/${target}`;
    const dir = pathname.replace(/^\//, '');
    const absFile = path.join(root, dir, 'index.html');
    const conflictHtml = path.join(root, `${dir}.html`);
    if (fs.existsSync(conflictHtml)) continue;
    fs.mkdirSync(path.dirname(absFile), { recursive: true });
    fs.writeFileSync(absFile, redirectHtml(absTarget));
    count += 1;
  }
  return count;
}

function patch404(root, map) {
  const file = path.join(root, '404.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  const scriptClean = `<script>
(function () {
  var MAP = ${JSON.stringify(map)};
  var path = (location.pathname || '/').replace(/\\\\/g, '/');
  if (path.length > 1 && path.slice(-1) === '/') path = path.slice(0, -1);
  path = path.toLowerCase();
  var dest = MAP[path];
  if (!dest) {
    var m = /^\\/product\\/([^/]+)$/.exec(path);
    if (m) dest = 'product.html#' + encodeURIComponent(m[1]);
  }
  if (dest) {
    var url = dest.charAt(0) === '/' ? dest : '/' + dest;
    location.replace(url);
  }
})();
</script>
`;

  // Fix: in a template literal, \\ becomes \ in output. For regex in output we need \/product\/
  // Actually we want the OUTPUT file to contain: /^\/product\/([^/]+)$/
  // In template literal: `/^\\/product\\/([^/]+)$/`  → output /^\/product\/([^/]+)$/  Good.

  if (html.includes('<!-- legacy-redirects -->')) {
    html = html.replace(
      /<!-- legacy-redirects -->[\s\S]*?<!-- \/legacy-redirects -->\n?/,
      `<!-- legacy-redirects -->\n${scriptClean}<!-- /legacy-redirects -->\n`,
    );
  } else {
    html = html.replace(
      /<head>/i,
      `<head>\n<!-- legacy-redirects -->\n${scriptClean}<!-- /legacy-redirects -->`,
    );
  }

  html = html
    .replace(/(href|src)="(assets\/|css\/|js\/)/g, '$1="/$2')
    .replace(/window\.__SITE_BASE__\s*=\s*""/, 'window.__SITE_BASE__ = "/"');

  fs.writeFileSync(file, html);
}

function ensureFaviconIco(root) {
  const png = path.join(root, 'assets/favicon.png');
  const ico = path.join(root, 'favicon.ico');
  if (fs.existsSync(png) && !fs.existsSync(ico)) {
    fs.copyFileSync(png, ico);
    return true;
  }
  if (fs.existsSync(png)) {
    fs.copyFileSync(png, ico);
    return true;
  }
  return false;
}

export function buildLegacyRedirects(root, catalog) {
  const map = buildRedirectMap(root, catalog);
  const n = writeStaticRedirects(root, map);
  patch404(root, map);
  const fav = ensureFaviconIco(root);
  console.log(
    `  legacy redirects: ${Object.keys(map).length} paths, ${n} static pages` +
      (fav ? ', favicon.ico' : ''),
  );
  return map;
}

// CLI: node scripts/legacy-redirects.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(__dirname, '..');
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'),
  );
  buildLegacyRedirects(root, catalog);
}
