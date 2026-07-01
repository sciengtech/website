/**
 * Export full product inventory to Excel (category, image status, etc.).
 * Run: node scripts/export-product-inventory.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { solutionGroupLabel } from './solution-groups.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'product-inventory.xlsx');

function cleanName(name) {
  return String(name || '')
    .replace(/^[\u2018\u2019'']+|[\u2018\u2019'']+$/g, '')
    .trim();
}

function imageFileExists(rel) {
  if (!rel) return false;
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function countProductImages(p) {
  if (p.images?.length) {
    return p.images.filter((src) => imageFileExists(src)).length;
  }
  const dir = path.join(ROOT, 'assets', 'products', p.id);
  if (!fs.existsSync(dir)) return p.image && imageFileExists(p.image) ? 1 : 0;
  const files = fs.readdirSync(dir).filter((f) => /^(primary|image-\d+)\./i.test(f));
  return files.length;
}

function categoryFor(p) {
  if (p.type === 'solution') {
    return {
      categorySlug: p.solutionGroup || '',
      categoryLabel: p.categoryLabel || solutionGroupLabel(p.solutionGroup),
    };
  }
  return {
    categorySlug: p.category || '',
    categoryLabel: p.categoryLabel || p.category || '',
  };
}

function urlFor(p) {
  if (p.type === 'solution') {
    return p.solutionUrl || `solutions/${p.id}.html`;
  }
  return `product.html#${encodeURIComponent(p.id)}`;
}

function rowFor(p, index) {
  const { categorySlug, categoryLabel } = categoryFor(p);
  const hasPrimary = imageFileExists(p.image);
  const imageCount = countProductImages(p);
  const noImages = !hasPrimary && imageCount === 0;

  return {
    '#': index,
    SKU: p.sku || '',
    'Product ID': p.id,
    Name: cleanName(p.name),
    Type: p.type === 'solution' ? 'Solution' : 'Component',
    'Category / Group': categoryLabel,
    'Category Slug': categorySlug,
    'Page Template': p.pageTemplate || '',
    'Has Primary Image': hasPrimary ? 'Yes' : 'No',
    'Image Count': imageCount,
    'Missing Images': noImages ? 'YES — needs image' : '',
    'Primary Image Path': p.image || '',
    'Product URL': urlFor(p),
    'Writeup Source': p.writeupPath || '',
    Summary: (p.summary || '').slice(0, 200),
  };
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
  const all = [...(catalog.solutions || []), ...(catalog.components || [])].sort((a, b) => {
    const catA = categoryFor(a).categoryLabel;
    const catB = categoryFor(b).categoryLabel;
    return catA.localeCompare(catB) || cleanName(a.name).localeCompare(cleanName(b.name));
  });

  const rows = all.map((p, i) => rowFor(p, i + 1));
  const missing = rows.filter((r) => r['Missing Images']);

  const wb = XLSX.utils.book_new();

  const wsAll = XLSX.utils.json_to_sheet(rows);
  wsAll['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 36 },
    { wch: 48 },
    { wch: 12 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 42 },
    { wch: 36 },
    { wch: 40 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Products');

  const wsMissing = XLSX.utils.json_to_sheet(missing);
  wsMissing['!cols'] = wsAll['!cols'];
  XLSX.utils.book_append_sheet(wb, wsMissing, 'Missing Images');

  const byCategory = {};
  for (const r of rows) {
    const key = r['Category / Group'] || 'Uncategorized';
    if (!byCategory[key]) byCategory[key] = { Category: key, Total: 0, 'With Images': 0, 'Missing Images': 0 };
    byCategory[key].Total += 1;
    if (r['Missing Images']) byCategory[key]['Missing Images'] += 1;
    else byCategory[key]['With Images'] += 1;
  }
  const summaryRows = Object.values(byCategory).sort((a, b) => a.Category.localeCompare(b.Category));
  summaryRows.push({
    Category: 'TOTAL',
    Total: rows.length,
    'With Images': rows.length - missing.length,
    'Missing Images': missing.length,
  });
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  XLSX.writeFile(wb, OUT);

  console.log(`Wrote ${rows.length} products (${missing.length} missing images) → ${OUT}`);
}

main();
