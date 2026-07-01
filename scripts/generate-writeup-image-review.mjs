/**
 * Build interactive image review for client Webpage_Writeup folder.
 * Run: node scripts/generate-writeup-image-review.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import {
  WRITEUP_REL,
  getTopCategory,
  isSolutionTopCategory,
  resolveProductId,
  findImages,
  walkDocx,
  cleanName,
} from './writeup-catalog-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WRITEUP = path.join(ROOT, WRITEUP_REL);
const OUT = path.join(ROOT, 'assets', 'imported', 'writeup');

async function parseDocxTitle(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const first = result.value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 2);
    return cleanName(first || '');
  } catch {
    return '';
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  if (!fs.existsSync(WRITEUP)) {
    console.error('Writeup folder not found:', WRITEUP);
    console.error('Copy client folder to:', WRITEUP);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  const docxFiles = await walkDocx(WRITEUP);
  const manifest = [];
  const seenIds = new Map();

  for (const file of docxFiles) {
    const topCat = getTopCategory(file.rel);
    if (topCat === 'SET Logo') continue;

    const title = await parseDocxTitle(file.full);
    const id = resolveProductId({
      fileName: file.name,
      topCat,
      parsedName: title,
    });
    const isSolution = isSolutionTopCategory(topCat);
    const name = title || file.name.replace(/\.docx$/i, '');

    const images = findImages(file.dir);
    const folderRel = `assets/imported/writeup/${id}`;
    const folderAbs = path.join(OUT, id);
    fs.mkdirSync(folderAbs, { recursive: true });

    const copied = [];
    for (const src of images) {
      const base = path.basename(src);
      let destName = base;
      let n = 1;
      while (copied.includes(destName)) {
        const ext = path.extname(base);
        const stem = path.basename(base, ext);
        destName = `${stem}-${n}${ext}`;
        n += 1;
      }
      fs.copyFileSync(src, path.join(folderAbs, destName));
      copied.push(destName);
    }

    const entry = {
      id,
      name,
      type: isSolution ? 'solution' : 'component',
      category: topCat,
      writeupPath: file.rel.replace(/\\/g, '/'),
      folder: folderRel,
      images: copied.join(', '),
    };

    if (seenIds.has(id)) {
      const prev = seenIds.get(id);
      const merged = new Set([...prev.images.split(', ').filter(Boolean), ...copied]);
      prev.images = [...merged].join(', ');
      prev.writeupPath += `; ${entry.writeupPath}`;
      if (!prev.images && copied.length) {
        prev.folder = folderRel;
      }
      continue;
    }

    seenIds.set(id, entry);
    manifest.push(entry);
  }

  manifest.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const catalogData = JSON.stringify(
    manifest.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      category: m.category,
      folder: m.folder,
      images: m.images.split(', ').filter(Boolean),
      writeupPath: m.writeupPath,
    }))
  );

  const html = buildReviewHtml(catalogData);
  fs.writeFileSync(path.join(OUT, 'review.html'), html);
  console.log(`Wrote review for ${manifest.length} products → assets/imported/writeup/review.html`);
}

function buildReviewHtml(catalogData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Writeup image review | SciEngTech</title>
  <style>
    :root { --bg: #0E1118; --elevated: #161B26; --border: #2A3142; --accent: #E11D48; --muted: #64748B; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: #fff; margin: 0; padding-bottom: 120px; }
    .toolbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(14,17,24,0.97); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); padding: 14px 24px;
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
    }
    .toolbar h1 { font-size: 1rem; color: var(--accent); margin: 0; }
    .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn {
      padding: 8px 14px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--elevated); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn:hover { border-color: var(--accent); }
    .btn-primary { background: var(--accent); border-color: var(--accent); }
    .progress { font-size: 13px; color: var(--muted); }
    .wrap { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .lead { color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
    .filter-row input, .filter-row select {
      padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--elevated); color: #fff; font-size: 13px;
    }
    .product-block {
      background: var(--elevated); border: 1px solid var(--border); border-radius: 10px;
      padding: 20px; margin-bottom: 24px;
    }
    .product-block.is-done { border-color: rgba(34,197,94,0.4); }
    .product-block.no-images { opacity: 0.75; }
    .product-head { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .product-title { font-size: 1rem; margin: 0 0 4px; }
    .tag { display: inline-block; background: rgba(225,29,72,0.15); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase; margin-right: 6px; }
    .pid { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
    .decision-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .decision-row label {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
      border: 1px solid var(--border); border-radius: 999px; font-size: 12px; cursor: pointer;
    }
    .decision-row input { accent-color: var(--accent); }
    .decision-row label:has(input:checked) { border-color: var(--accent); background: rgba(225,29,72,0.12); }
    .notes { width: 100%; max-width: 480px; margin-top: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: #fff; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .img-card {
      background: #000; border: 2px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer;
      transition: border-color 0.15s;
    }
    .img-card:hover { border-color: #94a3b8; }
    .img-card.is-selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .img-card img { width: 100%; aspect-ratio: 4/3; object-fit: contain; display: block; }
    .img-card figcaption { padding: 8px 10px; font-size: 11px; color: #94a3b8; background: var(--elevated); }
    .source { font-size: 11px; color: var(--muted); margin-top: 12px; word-break: break-all; }
    .empty { color: var(--muted); font-size: 13px; font-style: italic; }
    .export-panel {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 101;
      background: var(--elevated); border-top: 1px solid var(--border); padding: 16px 24px;
      display: none;
    }
    .export-panel.is-open { display: block; }
    .export-panel textarea {
      width: 100%; min-height: 140px; margin-top: 10px; padding: 12px;
      border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: #fff;
      font-family: ui-monospace, monospace; font-size: 12px;
    }
    .export-panel-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <h1>Client writeup — image selection</h1>
      <p class="progress" id="progressText">0 / 0 reviewed</p>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn" id="btnSave">Save locally</button>
      <button type="button" class="btn btn-primary" id="btnExport">Copy for Cursor</button>
      <button type="button" class="btn" id="btnDownload">Download JSON</button>
      <button type="button" class="btn" id="btnClear">Clear all</button>
    </div>
  </div>

  <div class="wrap">
    <p class="lead">
      Images from the client <strong>Webpage_Writeup</strong> folder. For each product choose
      <strong>Use</strong>, <strong>Revamp</strong>, or <strong>Skip</strong>. Click an image to set it as primary.
      Then <strong>Copy for Cursor</strong> and paste into chat to apply selections to the live catalog.
    </p>
    <div class="filter-row">
      <input type="search" id="searchInput" placeholder="Search by name or id…" />
      <select id="filterType">
        <option value="">All types</option>
        <option value="component">Components</option>
        <option value="solution">Solutions</option>
      </select>
      <select id="filterStatus">
        <option value="">All status</option>
        <option value="pending">Not reviewed</option>
        <option value="done">Reviewed</option>
        <option value="no-images">No images</option>
      </select>
    </div>
    <div id="products"></div>
  </div>

  <div class="export-panel" id="exportPanel">
    <div class="export-panel-head">
      <strong>Copy this and paste into Cursor chat:</strong>
      <button type="button" class="btn" id="btnCloseExport">Close</button>
    </div>
    <textarea id="exportText" readonly></textarea>
    <button type="button" class="btn btn-primary" id="btnCopyAgain" style="margin-top:8px">Copy again</button>
  </div>

  <script>
    const CATALOG = ${catalogData};
    const STORAGE_KEY = 'sciengtech-writeup-image-selections-v2';
    const state = loadState();
    let filters = { q: '', type: '', status: '' };

    function loadState() {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) return JSON.parse(s);
      } catch (e) {}
      return {};
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateProgress();
    }

    function defaultItem() { return { decision: '', image: '', notes: '' }; }
    function getItem(id) {
      if (!state[id]) state[id] = defaultItem();
      return state[id];
    }

    function filteredCatalog() {
      return CATALOG.filter(function (p) {
        if (filters.type && p.type !== filters.type) return false;
        const item = getItem(p.id);
        const hasImages = p.images.length > 0;
        if (filters.status === 'pending' && item.decision) return false;
        if (filters.status === 'done' && !item.decision) return false;
        if (filters.status === 'no-images' && hasImages) return false;
        if (filters.q) {
          const q = filters.q.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.id.includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
        }
        return true;
      });
    }

    function render() {
      const list = filteredCatalog();
      document.getElementById('products').innerHTML = list.map(renderProduct).join('');
      bindEvents();
      updateProgress();
    }

    function renderProduct(p) {
      const item = getItem(p.id);
      const done = item.decision ? ' is-done' : '';
      const noImg = !p.images.length ? ' no-images' : '';
      const imgs = p.images.map(function (file) {
        const sel = item.image === file ? ' is-selected' : '';
        return '<figure class="img-card' + sel + '" data-id="' + p.id + '" data-file="' + file + '">' +
          '<img src="/' + p.folder + '/' + file + '" alt="" loading="lazy" />' +
          '<figcaption>' + file + '</figcaption></figure>';
      }).join('');
      return '<article class="product-block' + done + noImg + '" data-product="' + p.id + '">' +
        '<div class="product-head">' +
          '<div><span class="tag">' + p.type + '</span><span class="tag">' + escapeHtml(p.category) + '</span>' +
          '<h2 class="product-title">' + escapeHtml(p.name) + '</h2>' +
          '<div class="pid">' + p.id + '</div></div>' +
          '<div class="decision-row">' +
            decisionLabel(p.id, 'use', 'Use as-is', item.decision) +
            decisionLabel(p.id, 'revamp', 'Revamp', item.decision) +
            decisionLabel(p.id, 'skip', 'Skip', item.decision) +
          '</div>' +
        '</div>' +
        (p.images.length ? '<div class="grid">' + imgs + '</div>' : '<p class="empty">No images in writeup folder — mark Revamp or Skip.</p>') +
        '<input type="text" class="notes" placeholder="Notes (optional)" data-notes="' + p.id + '" value="' + escapeAttr(item.notes) + '" />' +
        '<p class="source">Writeup: ' + escapeHtml(p.writeupPath) + '</p>' +
      '</article>';
    }

    function decisionLabel(id, value, label, current) {
      const checked = current === value ? ' checked' : '';
      return '<label><input type="radio" name="decision-' + id + '" value="' + value + '"' + checked + ' /> ' + label + '</label>';
    }

    function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function escapeAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

    function bindEvents() {
      document.querySelectorAll('.img-card[data-id]').forEach(function (card) {
        card.addEventListener('click', function () {
          const id = card.dataset.id;
          const file = card.dataset.file;
          const item = getItem(id);
          item.image = item.image === file ? '' : file;
          if (item.image && !item.decision) item.decision = 'use';
          saveState();
          render();
        });
      });
      document.querySelectorAll('.decision-row input[type=radio]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          getItem(radio.name.replace('decision-', '')).decision = radio.value;
          saveState();
          render();
        });
      });
      document.querySelectorAll('.notes').forEach(function (input) {
        input.addEventListener('input', function () {
          getItem(input.dataset.notes).notes = input.value;
          saveState();
        });
      });
    }

    function updateProgress() {
      const reviewed = CATALOG.filter(function (p) { return getItem(p.id).decision; }).length;
      document.getElementById('progressText').textContent = reviewed + ' / ' + CATALOG.length + ' reviewed';
    }

    function buildExport() {
      const lines = ['## Writeup image selections for SciEngTech', '', 'Save JSON to data/image-selections.json then run npm run apply-images', ''];
      const json = { exportedAt: new Date().toISOString(), source: 'writeup', selections: [] };
      CATALOG.forEach(function (p) {
        const item = getItem(p.id);
        if (!item.decision) return;
        const entry = {
          id: p.id,
          name: p.name,
          type: p.type,
          decision: item.decision,
          image: item.image || null,
          path: item.image ? p.folder + '/' + item.image : null,
          notes: item.notes || ''
        };
        json.selections.push(entry);
        lines.push('- **' + p.id + '**: **' + item.decision.toUpperCase() + '**' +
          (item.image ? ' → \`' + item.image + '\`' : '') +
          (item.notes ? ' — _' + item.notes + '_' : ''));
      });
      const pending = CATALOG.filter(function (p) { return !getItem(p.id).decision; });
      if (pending.length) {
        lines.push('', '### Not yet reviewed (' + pending.length + ')', pending.map(function (p) { return '- ' + p.id; }).join('\\n'));
      }
      lines.push('', '### JSON', '\`\`\`json', JSON.stringify(json, null, 2), '\`\`\`');
      return { text: lines.join('\\n'), json: json };
    }

    document.getElementById('searchInput').addEventListener('input', function (e) {
      filters.q = e.target.value;
      render();
    });
    document.getElementById('filterType').addEventListener('change', function (e) {
      filters.type = e.target.value;
      render();
    });
    document.getElementById('filterStatus').addEventListener('change', function (e) {
      filters.status = e.target.value;
      render();
    });
    document.getElementById('btnSave').addEventListener('click', function () {
      saveState();
      alert('Selections saved in this browser.');
    });
    document.getElementById('btnExport').addEventListener('click', function () {
      const out = buildExport();
      document.getElementById('exportText').value = out.text;
      document.getElementById('exportPanel').classList.add('is-open');
      navigator.clipboard.writeText(out.text).catch(function () {});
    });
    document.getElementById('btnCopyAgain').addEventListener('click', function () {
      const ta = document.getElementById('exportText');
      ta.select();
      navigator.clipboard.writeText(ta.value);
    });
    document.getElementById('btnCloseExport').addEventListener('click', function () {
      document.getElementById('exportPanel').classList.remove('is-open');
    });
    document.getElementById('btnDownload').addEventListener('click', function () {
      const out = buildExport();
      const blob = new Blob([JSON.stringify(out.json, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'image-selections-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    });
    document.getElementById('btnClear').addEventListener('click', function () {
      if (confirm('Clear all selections?')) {
        Object.keys(state).forEach(function (k) { delete state[k]; });
        saveState();
        render();
      }
    });

    render();
  </script>
</body>
</html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
