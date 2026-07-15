/**
 * One-shot catalog cleanups from client PDF (Jul 2026).
 * Run: node scripts/apply-client-pdf-changes.mjs
 * Then: npm run build:site
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'data', 'catalog.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function makeSearch(p) {
  return [
    p.id,
    p.sku,
    p.name,
    p.type,
    p.solutionGroup || p.category,
    p.categoryLabel,
    p.summary,
    p.specHighlight,
    (p.aliases || []).join(' '),
    (p.tags || []).join(' '),
    p.body || '',
  ]
    .join(' ')
    .toLowerCase();
}

function dropOverviewMatching(p, patterns) {
  if (!p.overview?.length) return;
  p.overview = p.overview.filter((t) => !patterns.some((re) => re.test(t)));
}

function setImages(p, imgs) {
  p.images = imgs;
  p.image = imgs[0] || null;
}

function scrubApps(p, dropExact = [], dropPatterns = []) {
  if (!p.applications?.length) return;
  p.applications = p.applications.filter((a) => {
    if (dropExact.includes(a)) return false;
    if (dropPatterns.some((re) => re.test(a))) return false;
    return true;
  });
}

const byId = Object.fromEntries(catalog.components.map((c) => [c.id, c]));

// —— Explicit overview removals from PDF ——
const OVERVIEW_DROPS = {
  'aluminium-laser-safety-screen': [/SciEngTech Solutions offers high-quality Laser Safety Screens/i],
  'hex-locking-thumbscrew': [/SciEngTech Hex Locking Thumbscrew provide/i],
  'magnetic-and-non-magnetic-studded-base-adapter': [/SciEngTech Solutions offers high-quality pedestal base adapters/i],
  'rubber-damping-feet': [/SciEngTech rubber damping feet are designed/i],
  'swivel-base-adapter': [/360° Swivel Base Adapter is thoughtfully engineered/i],
  'cube-beamsplitter-mount': [/SciEngTech Solutions offers cube beamsplitter mounts/i],
  'clamping-fork': [/SciEngTech Solutions offers high-quality pedestal forks/i],
  'lens-tube-with-retaining-ring': [/SciEngTech Solutions offers/i],
  baseplate: [/SciEngTech Solutions offers high-quality optical post bases/i],
  breadboard: [/SciEngTech Solutions offers precision-engineered optical breadboards/i],
  collars: [/SciEngTech Post Collars provide/i],
  'optical-post': [/SciEngTech Solutions offers high-quality Ø12\.7 mm/i],
  'pedestal-post-holder': [/SciEngTech Solutions offers precision-machined optical post holders/i],
  'post-holder': [/SciEngTech Solutions offers precision-machined optical post holders/i],
  'flip-mount-adapter': [/SciEngTech Solutions offers precision-engineered Flip mount/i],
  'hex-keys': [/SciEngTech Solutions offers high-quality Stainless Steel/i],
  'hex-nut': [/SciEngTech Solutions offers high-quality Stainless Steel SS303\s+Hex Nuts/i],
  washer: [/SciEngTech Solutions offers high-quality Stainless Steel SS303 Washers/i],
  'spanner-wrench': [/SciEngTech SM1 Retaining Ring Adjustment Tool provide/i],
};

for (const [id, patterns] of Object.entries(OVERVIEW_DROPS)) {
  if (byId[id]) dropOverviewMatching(byId[id], patterns);
}

// Swivel: keep remaining short points as features if overview emptied awkwardly
{
  const p = byId['swivel-base-adapter'];
  if (p) {
    // After dropping first para, convert remaining long overview into features bullets
    const leftover = (p.overview || []).slice();
    p.overview = [];
    if (!p.features?.length) {
      p.features = [
        'Smooth, precise 360° rotational adjustment',
        'Enhanced layout flexibility in compact optical systems',
        'Reduced alignment and setup time',
        'Premium black anodised aluminium construction',
        'Fully compatible with all Ø1/2" post holders',
        'M6 mounting hole allows direct attachment to optical breadboards and mounting platforms',
      ];
    }
    // Spelling note covered in features
    void leftover;
  }
}

// Hex locking: promote remaining overview into features
{
  const p = byId['hex-locking-thumbscrew'];
  if (p && p.overview?.length && !p.features?.length) {
    p.features = p.overview.slice();
    p.overview = [];
  }
}

// Safety screen: keep technical paras as features if empty
{
  const p = byId['aluminium-laser-safety-screen'];
  if (p) {
    if (p.overview?.length && !p.features?.length) {
      p.features = p.overview.slice();
      p.overview = [];
    }
    setImages(p, ['assets/products/aluminium-laser-safety-screen/primary.png']);
  }
}

// Rubber feet: remove breadboard secondary image
{
  const p = byId['rubber-damping-feet'];
  if (p) {
    setImages(p, ['assets/products/rubber-damping-feet/primary.png']);
    p.overview = [];
  }
}

// Cube beamsplitter: drop 2nd image
{
  const p = byId['cube-beamsplitter-mount'];
  if (p) setImages(p, ['assets/products/cube-beamsplitter-mount/primary.png']);
}

// Pedestal post holder: drop 2nd image
{
  const p = byId['pedestal-post-holder'];
  if (p) setImages(p, ['assets/products/pedestal-post-holder/primary.png']);
}

// Magnetic base adapter: clear marketing; keep next paras as features
{
  const p = byId['magnetic-and-non-magnetic-studded-base-adapter'];
  if (p) {
    if (p.overview?.length && !p.features?.length) {
      p.features = p.overview.slice();
      p.overview = [];
    }
    // Simple comparison table
    p.pageTemplate = p.pageTemplate || 'variant-catalog';
    if (!p.variants?.length) {
      p.variants = [
        { sr: 1, type: 'Magnetic studded base adapter', sku: 'SET-MS-PBA-318', product_code: 'SET-MS-PBA-318' },
        { sr: 2, type: 'Non-magnetic studded base adapter', sku: 'SET-NMS-PBA-318', product_code: 'SET-NMS-PBA-318' },
      ];
    }
  }
}

// Mountable tool kit: remove hex-size table; update copy
{
  const p = byId['mountable-tool-kit'];
  if (p) {
    p.variants = [];
    p.pageTemplate = 'component';
    p.overview = [
      'The Tool Kit Organizer is designed for convenient and efficient storage, with the ability to bolt directly onto an optical table for easy access during experiments.',
      'It includes a complete set of balldrivers and hex keys in the specified sizes. All balldrivers feature high-strength alloy steel blades, ensuring durability and reliable performance in precision optical setups. Caddy does not include hex keys and screw drivers.',
    ];
    p.body =
      'Mountable Tool Kit\n\n' +
      p.overview.join('\n\n') +
      '\n\nProduct Code: SET-TL-Kit';
  }
}

// Universal base plate: remove Notes from applications
{
  const p = byId['universal-base-plate'];
  if (p) scrubApps(p, ['Notes']);
}

// Lens tube: remove Sr No dump from applications (keep real apps only)
{
  const p = byId['lens-tube-with-retaining-ring'];
  if (p) {
    scrubApps(p, [], [/^(Sr No|Length of lens tube|Product Code|\d+(\.\d+)?|SET-)/i]);
    p.hideSrColumn = true;
  }
}

// Hex nut: shorten to nut types only once (remove SciEngTech marketing already)
{
  const p = byId['hex-nut'];
  if (p) {
    p.overview = [
      'Nut Type: M2, M2.5, M3, M4, M5, M6, M8, M10, M12, M14, M16, M18, M20, M22, M24, M27, M30',
    ];
  }
}

// Hex keys: add sizes 4,5,6 note
{
  const p = byId['hex-keys'];
  if (p) {
    p.overview = ['Available sizes include 1.5, 2, 2.5, 3, 4, 5, and 6 mm (and other standard metric hex sizes on request).'];
  }
}

// Diode laser: fix card badge
{
  const p = byId['diode-laser'];
  if (p) {
    p.specHighlight = '12 wavelength / power configurations · 1 mW & 5 mW';
    p.hideSkuColumn = true;
  }
}

// Breadboard: no border
{
  const p = byId['breadboard'];
}

// Clamping arm: material
{
  const p = byId['clamping-arm'];
  if (p) {
    const mat = 'Material — Fabricated from corrosion-resistant 303 stainless steel';
    if (!p.features?.includes(mat)) p.features = [...(p.features || []), mat];
  }
}

// Magnetic beam height ruler: applications if empty
{
  const p = byId['magnetic-beam-height-ruler'];
  if (p && (!p.applications || !p.applications.length)) {
    p.applications = [
      'Laser beam height measurement and alignment',
      'Optical breadboard and table setup',
      'Photonics and quantum optics laboratories',
      'Teaching and research beamline layout',
    ];
  }
}

// Compact variable height clamp: single overview block (dedupe)
{
  const p = byId['compact-variable-height-clamp'];
  if (p && p.overview?.length > 1) {
    p.overview = [p.overview[0]];
  }
}

// Viewing screen: ensure size mentioned
{
  const p = byId['viewing-screen'];
  if (p) {
    const hasSize = (p.applications || []).some((a) => /\d+\s*mm/i.test(a)) ||
      (p.overview || []).some((a) => /\d+\s*mm/i.test(a)) ||
      (p.features || []).some((a) => /\d+\s*mm/i.test(a));
    if (!hasSize) {
      p.features = [...(p.features || []), 'Screen size: confirm dimensions with quotation (custom sizes available)'];
    }
  }
}

// Post holder: magnetic vs standard table hint via variants if not present as such
{
  const p = byId['post-holder'];
  if (p && p.variants?.length) {
    // keep existing length variants; add note in features
    const note = 'Available with standard base and magnetic base options';
    if (!p.features?.some((f) => /magnetic base/i.test(f))) {
      p.features = [...(p.features || []), note];
    }
  }
}

// Universal post holder: fix wrong overview (was swivel text)
{
  const p = byId['universal-post-holder'];
  if (p && /swivel base adapter/i.test(p.overview?.[0] || '')) {
    p.overview = [
      'Universal post holders provide flexible, stable support for Ø1/2" optical posts with rapid positioning on optical tables and breadboards.',
    ];
  }
}

// Kinematic mirror mount: trim feature list (keep first 8)
{
  const p = byId['kinematic-mirror-mount'];
  if (p?.features?.length > 10) {
    p.features = p.features.slice(0, 8);
  }
}

// Flag smaller / borderless media products
for (const id of [
  'baseplate',
  'collars',
  'lens-mount',
  'optical-post',
  'labjack',
  'kinematic-platform-mount',
  'rotation-mount',
  'magnetic-and-non-magnetic-studded-base-adapter',
  'aluminium-laser-safety-screen',
  'cleanroom-and-optics-cleaning-solutions',
  'hex-keys',
  'hex-nut',
  'washer',
]) {
  if (byId[id]) byId[id].compactMedia = true;
}

// —— Category display order (stable sort keys) ——
const OPTO_ORDER = [
  'optical-post',
  'post-holder',
  'pedestal-post-holder',
  'universal-post-holder',
  'clamping-fork',
  'baseplate',
  'universal-base-plate',
  'magnetic-and-non-magnetic-studded-base-adapter',
  'swivel-base-adapter',
  'hex-locking-thumbscrew',
  'breadboard',
  'rubber-damping-feet',
  'collars',
  'angle-clamp',
  'lens-mount',
  '30-mm-cage-system-alignment-plate',
  'laser-beam-alignment-tool',
  'magnetic-beam-height-ruler',
  'lens-tube-with-retaining-ring',
  'spanner-wrench',
  'aluminium-laser-safety-screen',
  'viewing-screen',
  'adapter',
  'cube-beamsplitter-mount',
  'cage-assembly-rod',
  'cage-plate',
  'clamping-arm',
  'compact-variable-height-clamp',
  'table-clamp-l-shape',
  'mountable-tool-kit',
];

const MOTION_ORDER = [
  'kinematic-mirror-mount',
  'kinematic-platform-mount',
  'rotation-mount',
  'labjack',
  'linear-stage',
  'base-mounting-plate-for-linear-stage',
  'right-angle-bracket-for-linear-stage',
  'flip-mount-adapter',
];

OPTO_ORDER.forEach((id, i) => {
  if (byId[id]) byId[id].sortIndex = i + 1;
});
MOTION_ORDER.forEach((id, i) => {
  if (byId[id]) byId[id].sortIndex = i + 1;
});

// Regenerate body/_search for touched items
for (const p of catalog.components) {
  if (p.overview?.length || p.features?.length) {
    const parts = [p.name, ...(p.overview || []), ...(p.features || []).slice(0, 6)];
    if (!p.body || /SciEngTech (Solutions|Hex|rubber|Post Collars|SM1)/i.test(p.body)) {
      p.body = parts.filter(Boolean).join('\n\n');
    }
  }
  p._search = makeSearch(p);
}

// Quantum / training order + Made in India on existing solution templates
const QUANTUM_ORDER = [
  'entangled-photon-source',
  'quantum-key-distribution',
  'quantum-eraser',
  'bomb-tester',
  'hbt-and-hom',
  'quantum-tomography',
  'michelson-interferometer',
];
const TRAINING_ORDER = ['polarized-3d-cinema', 'fourier-optics-kit'];

catalog.solutions.forEach((s) => {
  const qi = QUANTUM_ORDER.indexOf(s.id);
  const ti = TRAINING_ORDER.indexOf(s.id);
  if (qi >= 0) s.sortIndex = qi + 1;
  if (ti >= 0) s.sortIndex = ti + 1;

  if (!s.solutionContent) s.solutionContent = { tagline: null, demonstrates: [], kitIncludes: [], capabilities: [] };
  const sc = s.solutionContent;
  if (!Array.isArray(sc.kitIncludes)) sc.kitIncludes = [];
  if (!Array.isArray(sc.capabilities)) sc.capabilities = [];
  const made = 'Proudly Designed and Manufactured in India';
  if (!sc.capabilities.includes(made)) sc.capabilities.push(made);
  // Clear broken RFQ engagement on catalog side (patch also updated)
  if (['ultrafast-photodiodes-assemblies', 'cw-and-pulsed-lasers', 'hbt-and-hom', 'quantum-tomography', 'pockels-cell-assemblies', 'white-light-supercontinuum-source', 'regenerative-delay-line'].includes(s.id)) {
    s.rfqSections = null;
  }
  s._search = makeSearch(s);
});

catalog.updated = new Date().toISOString().slice(0, 10);
catalog.counts = {
  solutions: catalog.solutions.length,
  components: catalog.components.length,
};

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('Updated', catalogPath);
console.log('Components:', catalog.components.length, 'Solutions:', catalog.solutions.length);
