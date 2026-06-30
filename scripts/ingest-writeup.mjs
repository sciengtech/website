/**
 * Ingest Webpage_Writeup docx files into catalog JSON + copy assets.
 * Run: node scripts/ingest-writeup.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WRITEUP = path.join(ROOT, '_writeup', 'Webpage_Writeup');
const ASSETS_OUT = path.join(ROOT, 'assets', 'products');
const DATA_OUT = path.join(ROOT, 'data');

const SOLUTION_SLUGS = {
  'Entangled Photon Source with Integrated Laser.docx': 'entangled-photon-source',
  'Quantum Eraser.docx': 'quantum-eraser',
  'QAKD.docx': 'quantum-key-distribution',
  'Bomb Tester.docx': 'bomb-tester',
  'Michelson Interferometer.docx': 'michelson-interferometer',
  'Fourier Optics Educational Kit.docx': 'fourier-optics-kit',
  '3D Cinema.docx': 'polarized-3d-cinema',
  'Custom Made,Turn Key,Regenerative cavity-like laser delay line.docx': 'regenerative-delay-line',
};

const CATEGORY_MAP = {
  'Opto-Mechanics': { slug: 'opto-mechanics', label: 'Opto-Mechanics' },
  'Motion and Positioning': { slug: 'motion-and-positioning', label: 'Motion and Positioning' },
  Hardware: { slug: 'hardware', label: 'Hardware' },
  'Fibre Optics': { slug: 'fibre-optics', label: 'Fibre Optics' },
  Lasers: { slug: 'lasers', label: 'Lasers' },
  Optics: { slug: 'optics', label: 'Optics' },
};

function cleanName(s) {
  return String(s)
    .replace(/^[\u2018\u2019'']+|[\u2018\u2019'']+$/g, '')
    .trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.docx$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function parseSpecs(text) {
  const specs = [];
  const codeMatch = text.match(/Product Code:\s*([A-Z0-9-]+)/i);
  const sku = codeMatch ? codeMatch[1].trim() : null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter(
    (l) =>
      l.length > 3 &&
      l.length < 120 &&
      !/^Product Code:/i.test(l) &&
      !/^SciEngTech/i.test(l) &&
      !/^Designed for/i.test(l)
  );

  bullets.slice(0, 8).forEach((line, i) => {
    if (line.includes(':') && line.length < 80) {
      const [label, ...rest] = line.split(':');
      specs.push({ label: label.trim(), value: rest.join(':').trim() });
    } else if (i < 6) {
      specs.push({ label: 'Feature', value: line });
    }
  });

  return { sku, specs };
}

function findImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => path.join(dir, f));
}

function copyAsset(src, id) {
  const ext = path.extname(src).toLowerCase();
  const destDir = path.join(ASSETS_OUT, id);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'primary' + ext);
  fs.copyFileSync(src, dest);
  return 'assets/products/' + id + '/primary' + ext;
}

function makeSearch(p) {
  return [
    p.id,
    p.sku,
    p.name,
    p.type,
    p.category,
    p.categoryLabel,
    p.summary,
    p.specHighlight,
    (p.tags || []).join(' '),
    (p.specs || []).map((s) => `${s.label} ${s.value}`).join(' '),
    p.body || '',
  ]
    .join(' ')
    .toLowerCase();
}

async function parseDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.replace(/\n{3,}/g, '\n\n').trim();
}

function getTopCategory(relPath) {
  const parts = relPath.split(path.sep);
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (parts.includes(key)) return key;
  }
  if (parts.includes('Quantum Set-Up')) return 'Quantum Set-Up';
  if (parts.includes('Training Kit')) return 'Training Kit';
  return parts[0] || 'Other';
}

async function walkDocx(dir, base = '') {
  const items = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      items.push(...(await walkDocx(full, rel)));
    } else if (/\.docx$/i.test(entry.name)) {
      items.push({ full, rel, name: entry.name, dir: dir });
    }
  }
  return items;
}

async function main() {
  if (!fs.existsSync(WRITEUP)) {
    console.error('Writeup folder not found:', WRITEUP);
    process.exit(1);
  }

  fs.mkdirSync(ASSETS_OUT, { recursive: true });
  fs.mkdirSync(DATA_OUT, { recursive: true });

  const docxFiles = await walkDocx(WRITEUP);
  const solutions = [];
  const components = [];

  for (const file of docxFiles) {
    const text = await parseDocx(file.full);
    const topCat = getTopCategory(file.rel);
    const isSolution =
      topCat === 'Quantum Set-Up' ||
      topCat === 'Training Kit' ||
      SOLUTION_SLUGS[file.name];

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const name = cleanName(lines[0] || file.name.replace(/\.docx$/i, ''));
    const { sku, specs } = parseSpecs(text);
    const summary =
      lines.find((l) => l.length > 40 && !/^SciEngTech/i.test(l)) ||
      lines.slice(1, 3).join(' ') ||
      name;

    const id = isSolution
      ? SOLUTION_SLUGS[file.name] || slugify(name)
      : slugify(name);

    const images = findImages(path.dirname(file.full));
    let image = null;
    if (images.length) {
      image = copyAsset(images[0], id);
    }

    const specHighlight =
      specs.length > 0
        ? specs
            .slice(0, 3)
            .map((s) => `${s.label.toUpperCase()}: ${s.value}`)
            .join(' | ')
        : sku || 'RFQ | Full specification on request';

    const item = {
      id,
      sku: sku || `SET-${id.toUpperCase().replace(/-/g, '').slice(0, 12)}`,
      name,
      type: isSolution ? 'solution' : 'component',
      summary: summary.slice(0, 500),
      specHighlight: specHighlight.slice(0, 200),
      specs: specs.length ? specs : [{ label: 'Procurement', value: 'Request Technical Quote' }],
      body: text,
      image,
      tags: [id.replace(/-/g, ' '), topCat.toLowerCase()],
      writeupPath: file.rel.replace(/\\/g, '/'),
    };

    item._search = makeSearch(item);

    if (isSolution) {
      item.solutionGroup =
        topCat === 'Training Kit' ? 'training-kits' : 'quantum-setups';
      item.solutionUrl = `solutions/${id}.html`;
      solutions.push(item);
    } else {
      const catMeta = CATEGORY_MAP[topCat] || {
        slug: slugify(topCat),
        label: topCat,
      };
      item.category = catMeta.slug;
      item.categoryLabel = catMeta.label;
      item.categoryPath = `/components/${catMeta.slug}.html`;
      components.push(item);
    }
  }

  const catalog = {
    version: 2,
    updated: new Date().toISOString().slice(0, 10),
    solutions: solutions.sort((a, b) => a.name.localeCompare(b.name)),
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
    counts: { solutions: solutions.length, components: components.length },
  };

  const products = {
    version: 2,
    updated: catalog.updated,
    count: components.length,
    products: components,
  };

  const searchIndex = {
    version: 2,
    updated: catalog.updated,
    items: [...solutions, ...components].map((p) => ({
      id: p.id,
      type: p.type,
      name: p.name,
      sku: p.sku,
      category: p.category || p.solutionGroup,
      categoryLabel: p.categoryLabel || (p.solutionGroup === 'training-kits' ? 'Training Kit' : 'Quantum Set-Up'),
      specHighlight: p.specHighlight,
      image: p.image,
      url: p.solutionUrl || `product.html?id=${encodeURIComponent(p.id)}`,
      _search: p._search,
      featured: p.type === 'solution',
    })),
  };

  fs.writeFileSync(path.join(DATA_OUT, 'catalog.json'), JSON.stringify(catalog, null, 2));
  fs.writeFileSync(path.join(DATA_OUT, 'products.json'), JSON.stringify(products, null, 2));
  fs.writeFileSync(path.join(DATA_OUT, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log(
    `Ingested ${solutions.length} solutions, ${components.length} components`
  );
  return catalog;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
