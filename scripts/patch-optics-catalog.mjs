/**
 * Consolidate optics into a single catalog product (no category hub).
 * Run: node scripts/patch-optics-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const catalogPath = path.join(ROOT, 'data/catalog.json');

export const OPTICS_PRODUCT_ID =
  'sciengtech-offers-a-comprehensive-range-of-optical-components-designed-to-meet-t';

const SPLIT_IDS = ['lenses', 'mirrors', 'beam-splitters', 'polarizers'];

function buildSearch(item) {
  return [
    item.id,
    item.sku,
    item.name,
    item.type,
    item.category,
    item.categoryLabel,
    item.summary,
    item.specHighlight,
    ...(item.aliases || []),
    ...(item.tags || []),
    item.body || '',
  ]
    .join(' ')
    .toLowerCase();
}

const keyValueSpecs = [
  { label: 'Lenses — Lens', value: 'Plano-Convex, Bi-Convex, Plano-Concave, Bi-Concave, Achromatic, Cylindrical, Aspheric, and Ball Lenses' },
  { label: 'Lenses — Material', value: 'BK7, Fused Silica, Optical Glass, and Specialty Glass' },
  { label: 'Lenses — Diameter', value: '6 mm, 12.7 mm, 25.4 mm, 50.8 mm' },
  { label: 'Lenses — Focal length', value: 'Short, Medium, and Long Focal Length Lenses' },
  { label: 'Lenses — Coating', value: 'Uncoated, MgF₂, Broadband Anti-Reflection, and Laser-Line AR Coating' },
  { label: 'Lenses — Wavelength', value: 'UV, Visible, NIR, and Selected Laser Wavelengths' },
  { label: 'Lenses — Mounting', value: 'Mounted and Unmounted Lenses' },
  { label: 'Lenses — Compatibility', value: 'Standard Opto-Mechanics' },
  { label: 'Mirrors — Mirror', value: 'Protected Silver, Protected Aluminum, Enhanced Aluminum, Dielectric, and Broadband Mirrors' },
  { label: 'Mirrors — Substrate', value: 'BK7, Fused Silica, Optical Glass, and Specialty Optical Materials' },
  { label: 'Mirrors — Diameter', value: '12.7 mm, 25.4 mm, 50.8 mm' },
  { label: 'Mirrors — Shape', value: 'Round, Square, Rectangular' },
  { label: 'Mirrors — Coating', value: 'Visible, NIR, Broadband, and Laser-Line Coatings' },
  { label: 'Mirrors — Reflectivity', value: 'High-Reflectivity Coatings for Selected Wavelengths' },
  { label: 'Mirrors — Mounting', value: 'Mounted and Unmounted Mirrors' },
  { label: 'Mirrors — Compatibility', value: 'Standard Opto-Mechanics' },
  { label: 'Beam Splitters — Type', value: 'Plate Beam Splitters, Cube Beam Splitters, Non-Polarizing Beam Splitters, and Polarizing Beam Splitters' },
  { label: 'Beam Splitters — Splitting Ratio (R/T)', value: '50:50, 70:30, 80:20, 90:10' },
  { label: 'Beam Splitters — Wavelength Range', value: 'Visible, NIR, Broadband and Laser-Line Wavelength Ranges' },
  { label: 'Beam Splitters — Coating', value: 'Broadband Coatings, Laser-Line Coatings, and Anti-Reflection Coated Back Surfaces' },
  { label: 'Beam Splitters — Material', value: 'BK7, Fused Silica, Optical Glass, and Specialty Optical Materials' },
  { label: 'Beam Splitters — Size', value: '12.7 mm, 25.4 mm, 50.8 mm, Cube Sizes, and Custom Dimensions' },
  { label: 'Beam Splitters — Mounting', value: 'Mounted and Unmounted Beam Splitters' },
  { label: 'Beam Splitters — Polarization', value: 'Polarization-Sensitive and Polarization-Insensitive Configurations' },
  { label: 'Beam Splitters — Compatibility', value: 'Standard Opto-Mechanics' },
  { label: 'Polarizers — Type', value: 'Linear Polarizers, Glan-Type Polarizers, Cube Polarizers, Wire-Grid Polarizers and Film Polarizers' },
  { label: 'Polarizers — Wavelength', value: 'Visible, NIR, and Selected Laser Wavelengths' },
  { label: 'Polarizers — Diameter', value: '12.7 mm, 25.4 mm, 50.8 mm' },
  { label: 'Polarizers — Mounting', value: 'Mounted and Unmounted Polarizers' },
  { label: 'Polarizers — Extinction Ratio', value: 'High-Extinction-Ratio Polarizers Where Required' },
  { label: 'Polarizers — Coating', value: 'Broadband and Laser-Line Options' },
  { label: 'Polarizers — Rotation Compatibility', value: 'Compatible with Standard Rotation Mounts' },
  { label: 'Polarizers — Polarizing Optics', value: 'Polarizing Beam Splitter Cube Options' },
  { label: 'Polarizers — Compatibility', value: 'Standard Opto-Mechanics' },
];

const opticsProduct = {
  id: OPTICS_PRODUCT_ID,
  sku: 'SET-OPTICS',
  name: 'Optics',
  type: 'component',
  pageTemplate: 'component',
  aliases: ['Lenses', 'Mirrors', 'Beam Splitters', 'Polarizers'],
  overview: [
    'Precision Optical Components for Advanced Research and Education',
    'SciEngTech Solutions LLP provides high-quality optics for advanced research laboratories, teaching laboratories, laser experiments, photonics systems, and quantum optics platforms. Our optics are selected and supplied with a focus on experimental reliability, clean beam handling, precise alignment, and compatibility with modern optical setups.',
  ],
  features: [
    'Wavelength: UV, Visible, and NIR',
    'Material: BK7, Fused Silica, Optical Glass, and Specialty Optical Materials',
    'Coating: Aluminium, Silver, Chromium, Dielectric, Anti-Reflection, Broadband and Laser-Line, Coated, Uncoated',
    'Size: Standard Diameters, Standard Shapes, and Custom Sizes',
    'Mounting Options: Mounted and Unmounted Optics',
  ],
  applications: [
    'Laser beam alignment',
    'Imaging and spectroscopy',
    'Interferometry',
    'Photonics experiments',
    'Optical instrumentation',
    'Quantum optics teaching and research setups',
    'Scientific and educational laboratories',
  ],
  techSpecs: [],
  keyValueSpecs,
  variants: [],
  configurationOptions: null,
  rfqSections: null,
  solutionContent: null,
  customNote:
    'Sci.Eng.Tech can help you selecting the right optical component for your experimental set-up. Contact Sci.Eng.Tech Solutions for technical guidance and customized optical solutions.',
  summary:
    'Precision optical components for advanced research and education — lenses, mirrors, beam splitters, and polarizers for photonics and quantum optics laboratories.',
  specHighlight: 'Lenses, Mirrors, Beam Splitters & Polarizers · Request Technical Quote',
  specs: [{ label: 'Procurement', value: 'Request Technical Quote' }],
  body: `Optics

Precision Optical Components for Advanced Research and Education

SciEngTech Solutions LLP provides high-quality optics for advanced research laboratories, teaching laboratories, laser experiments, photonics systems, and quantum optics platforms.

Lenses, Mirrors, Beam Splitters, and Polarizers are available in standard and custom configurations for photonics and quantum optics laboratories.

Product Code: SET-OPTICS`,
  image: 'assets/slides/03-dielectric-mirror.svg',
  tags: ['optics', 'lenses', 'mirrors', 'beam splitters', 'polarizers', 'photonics'],
  writeupPath: 'Optics/Mirrors.docx',
  category: 'optics',
  categoryLabel: 'Optics',
  categoryPath: `/product.html#${OPTICS_PRODUCT_ID}`,
};

opticsProduct._search = buildSearch(opticsProduct);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const splitIdx = catalog.components.findIndex((c) => SPLIT_IDS.includes(c.id));
if (splitIdx === -1 && !catalog.components.some((c) => c.id === OPTICS_PRODUCT_ID)) {
  console.error('No split optics products found to replace.');
  process.exit(1);
}

catalog.components = catalog.components.filter((c) => !SPLIT_IDS.includes(c.id));
const existingIdx = catalog.components.findIndex((c) => c.id === OPTICS_PRODUCT_ID);
if (existingIdx >= 0) {
  catalog.components[existingIdx] = opticsProduct;
} else {
  const insertAt = catalog.components.findIndex((c) => c.id === 'spanner-wrench');
  if (insertAt >= 0) catalog.components.splice(insertAt, 0, opticsProduct);
  else catalog.components.push(opticsProduct);
}

catalog.updated = '2026-07-03';
catalog.counts.components = catalog.components.length;

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`Optics consolidated to single product (${OPTICS_PRODUCT_ID}), ${catalog.counts.components} components total.`);
