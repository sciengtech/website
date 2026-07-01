/**
 * Shared Webpage_Writeup → catalog id / category mapping for ingest + image review.
 */
import fs from 'fs';
import path from 'path';

export const WRITEUP_REL = '_writeup/Webpage_Writeup';

export const SOLUTION_SLUGS = {
  'Entangled Photon Source with Integrated Laser.docx': 'entangled-photon-source',
  'Quantum Eraser.docx': 'quantum-eraser',
  'QAKD.docx': 'quantum-key-distribution',
  'Bomb Tester.docx': 'bomb-tester',
  'Michelson Interferometer.docx': 'michelson-interferometer',
  'Fourier Optics Educational Kit.docx': 'fourier-optics-kit',
  '3D Cinema.docx': 'polarized-3d-cinema',
  'Custom Made,Turn Key,Regenerative cavity-like laser delay line.docx': 'regenerative-delay-line',
};

export const SKIP_DOCX = new Set(['New Microsoft Word Document.docx']);

export const CATEGORY_MAP = {
  'Opto-Mechanics': { slug: 'opto-mechanics', label: 'Opto-Mechanics' },
  'Motion and Positioning': { slug: 'motion-and-positioning', label: 'Motion and Positioning' },
  Hardware: { slug: 'hardware', label: 'Hardware' },
  'Fibre Optics': { slug: 'fibre-optics', label: 'Fibre Optics' },
  Lasers: { slug: 'lasers', label: 'Lasers' },
  Optics: { slug: 'optics', label: 'Optics' },
  'Lab Accessories': { slug: 'lab-accessories', label: 'Lab Accessories' },
};

export function cleanName(s) {
  return String(s)
    .replace(/^[\u2018\u2019'']+|[\u2018\u2019'']+$/g, '')
    .trim();
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.docx$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function getTopCategory(relPath) {
  const parts = relPath.split(/[/\\]/);
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (parts.includes(key)) return key;
  }
  if (parts.includes('Quantum Set-Up')) return 'Quantum Set-Up';
  if (parts.includes('Training Kit')) return 'Training Kit';
  if (parts.includes('State of art Setup')) return 'State of art Setup';
  return parts[0] || 'Other';
}

export function isSolutionTopCategory(topCat) {
  return (
    topCat === 'Quantum Set-Up' ||
    topCat === 'Training Kit' ||
    topCat === 'State of art Setup'
  );
}

export function solutionGroupForTopCategory(topCat) {
  if (topCat === 'Training Kit') return 'training-kits';
  if (topCat === 'State of art Setup') return 'state-of-the-art-setups';
  return 'quantum-setups';
}

export function resolveProductId({ fileName, topCat, parsedName }) {
  if (SOLUTION_SLUGS[fileName]) return SOLUTION_SLUGS[fileName];
  const isSolution = isSolutionTopCategory(topCat) || Boolean(SOLUTION_SLUGS[fileName]);
  const name = cleanName(parsedName || fileName.replace(/\.docx$/i, ''));
  return slugify(name);
}

export function findImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => path.join(dir, f));
}

export async function walkDocx(dir, base = '') {
  const items = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      items.push(...(await walkDocx(full, rel)));
    } else if (/\.docx$/i.test(entry.name) && !SKIP_DOCX.has(entry.name)) {
      items.push({ full, rel, name: entry.name, dir: path.dirname(full) });
    }
  }
  return items;
}
