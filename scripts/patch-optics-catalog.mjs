/**
 * Consolidate optics into a single catalog product with tabbed spec sections.
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

const specSections = [
  {
    id: 'lenses',
    title: 'Lenses',
    specs: [
      { label: 'Lens', value: 'Plano-Convex, Bi-Convex, Plano-Concave, Bi-Concave, Achromatic, Cylindrical, Aspheric, and Ball Lenses' },
      { label: 'Material', value: 'BK7, Fused Silica, Optical Glass, and Specialty Glass' },
      { label: 'Diameter', value: '6 mm, 12.7 mm, 25.4 mm, 50.8 mm' },
      { label: 'Focal length', value: 'Short, Medium, and Long Focal Length Lenses' },
      { label: 'Coating', value: 'Uncoated, MgF₂, Broadband Anti-Reflection, and Laser-Line AR Coating' },
      { label: 'Wavelength', value: 'UV, Visible, NIR, and Selected Laser Wavelengths' },
      { label: 'Mounting', value: 'Mounted and Unmounted Lenses' },
      { label: 'Compatibility', value: 'Standard Opto-Mechanics' },
    ],
  },
  {
    id: 'mirrors',
    title: 'Mirrors',
    specs: [
      { label: 'Mirror', value: 'Protected Silver, Protected Aluminum, Enhanced Aluminum, Dielectric, and Broadband Mirrors' },
      { label: 'Substrate', value: 'BK7, Fused Silica, Optical Glass, and Specialty Optical Materials' },
      { label: 'Diameter', value: '12.7 mm, 25.4 mm, 50.8 mm' },
      { label: 'Shape', value: 'Round, Square, Rectangular' },
      { label: 'Coating', value: 'Visible, NIR, Broadband, and Laser-Line Coatings' },
      { label: 'Reflectivity', value: 'High-Reflectivity Coatings for Selected Wavelengths' },
      { label: 'Mounting', value: 'Mounted and Unmounted Mirrors' },
      { label: 'Compatibility', value: 'Standard Opto-Mechanics' },
    ],
  },
  {
    id: 'beam-splitters',
    title: 'Beam Splitters',
    specs: [
      { label: 'Beam Splitter', value: 'Plate Beam Splitters, Cube Beam Splitters, Non-Polarizing Beam Splitters, and Polarizing Beam Splitters' },
      { label: 'Splitting Ratio (R/T)', value: '50:50, 70:30, 80:20, 90:10' },
      { label: 'Wavelength Range', value: 'Visible, NIR, Broadband and Laser-Line Wavelength Ranges' },
      { label: 'Coating', value: 'Broadband Coatings, Laser-Line Coatings, and Anti-Reflection Coated Back Surfaces' },
      { label: 'Material', value: 'BK7, Fused Silica, Optical Glass, and Specialty Optical Materials' },
      { label: 'Size', value: '12.7 mm, 25.4 mm, 50.8 mm, Cube Sizes, and Custom Dimensions' },
      { label: 'Mounting', value: 'Mounted and Unmounted Beam Splitters' },
      { label: 'Polarization', value: 'Polarization-Sensitive and Polarization-Insensitive Configurations' },
      { label: 'Compatibility', value: 'Standard Opto-Mechanics' },
    ],
  },
  {
    id: 'polarizers',
    title: 'Polarizers',
    specs: [
      { label: 'Polarizer', value: 'Linear Polarizers, Glan-Type Polarizers, Cube Polarizers, Wire-Grid Polarizers and Film Polarizers' },
      { label: 'Wavelength', value: 'Visible, NIR, and Selected Laser Wavelengths' },
      { label: 'Diameter', value: '12.7 mm, 25.4 mm, 50.8 mm' },
      { label: 'Mounting', value: 'Mounted and Unmounted Polarizers' },
      { label: 'Extinction Ratio', value: 'High-Extinction-Ratio Polarizers Where Required' },
      { label: 'Coating', value: 'Broadband and Laser-Line Options' },
      { label: 'Rotation Compatibility', value: 'Compatible with Standard Rotation Mounts' },
      { label: 'Polarizing Optics', value: 'Polarizing Beam Splitter Cube Options' },
      { label: 'Compatibility', value: 'Standard Opto-Mechanics' },
    ],
  },
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
  keyValueSpecs: [],
  specSections,
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

Lenses, Mirrors, Beam Splitters, and Polarizers for photonics and quantum optics laboratories.

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
const idx = catalog.components.findIndex((c) => c.id === OPTICS_PRODUCT_ID);
if (idx === -1) {
  console.error('Optics product not found in catalog.');
  process.exit(1);
}

catalog.components[idx] = opticsProduct;
catalog.updated = '2026-07-03';

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`Updated optics product with ${specSections.length} tabbed spec sections.`);
