/**
 * Build static HTML pages from catalog data.
 * Run: node scripts/build-site.mjs (after ingest-writeup.mjs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderProductDetail } from './product-detail-template.mjs';
import { patchSolutionsCatalog } from './patch-solutions-catalog.mjs';
import { SOLUTION_GROUPS, solutionGroupLabel } from './solution-groups.mjs';
import { buildKnowledgePages } from './knowledge-build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const catalog = patchSolutionsCatalog(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'))
);

const CATEGORIES = [
  { slug: 'opto-mechanics', label: 'Opto-Mechanics' },
  { slug: 'motion-and-positioning', label: 'Motion and Positioning' },
  { slug: 'hardware', label: 'Hardware' },
  { slug: 'fibre-optics', label: 'Fibre Optics' },
  { slug: 'lasers', label: 'Lasers' },
  { slug: 'optics', label: 'Optics' },
  { slug: 'lab-accessories', label: 'Lab Accessories' },
];

/** Homepage category strip — 10 tiles in two rows */
const HOME_CATEGORIES = [
  { slug: 'optics', label: 'Optics', href: 'components/optics.html' },
  { slug: 'opto-mechanics', label: 'Opto-Mechanics', href: 'components/opto-mechanics.html' },
  { slug: 'motion-and-positioning', label: 'Motion and Positioning', href: 'components/motion-and-positioning.html' },
  { slug: 'lasers', label: 'Lasers and Detectors', href: 'components/lasers.html' },
  { slug: 'fibre-optics', label: 'Fibre Optics', href: 'components/fibre-optics.html' },
  {
    slug: 'quantum-technology',
    label: 'Quantum Technology',
    href: 'solutions/quantum-setups.html',
  },
  {
    slug: 'quantum-education',
    label: 'Quantum Education',
    href: 'solutions/quantum-setups.html',
  },
  {
    slug: 'photonics-training',
    label: 'Photonics Training',
    href: 'solutions/training-kits.html',
  },
  {
    slug: 'customised-solutions',
    label: 'Customised Solutions',
    href: 'solutions/state-of-the-art-setups.html',
  },
  { slug: 'hardware', label: 'Hardware', href: 'components/hardware.html' },
];

const CATEGORY_COVER_PREF = {
  'opto-mechanics': [
    'breadboard-optomechanical-platform-optical-mounting-board-precision-mounting-boa',
    'kinematic-mirror-mount-kinematic-optic-mount-precision-mirror-mount-kinematic-ro',
    'optical-post-optomechanical-support-post-mounting-post-optical-mounting-rod-thre',
  ],
  'motion-and-positioning': [
    'linear-stage',
    'kinematic-mirror-mount-kinematic-optic-mount-precision-mirror-mount-kinematic-ro',
    'labjack',
  ],
  hardware: ['hex-nut', 'allen-bolt', 'washer'],
  'fibre-optics': ['fiber-optics-collimator'],
  lasers: ['diode-laser'],
  optics: [
    'sciengtech-offers-a-comprehensive-range-of-optical-components-designed-to-meet-t',
  ],
};

const CATEGORY_COVER_SLIDE = {
  'fibre-optics': 'assets/slides/05-photodetector-module.png',
  lasers: 'assets/slides/01-translation-stage.png',
  optics: 'assets/slides/03-dielectric-mirror.png',
};

function assetExists(rel) {
  if (!rel) return false;
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function categoryCoverImage(slug) {
  const byId = Object.fromEntries(catalog.components.map((c) => [c.id, c]));
  for (const id of CATEGORY_COVER_PREF[slug] || []) {
    const item = byId[id];
    if (item?.image && assetExists(item.image)) return item.image;
    const imported = [
      `assets/imported/old-site/${id}/primary.png`,
      `assets/imported/old-site/${id}/primary.jpg`,
      `assets/imported/old-site/${id}/image-2.png`,
    ];
    for (const src of imported) {
      if (assetExists(src)) return src;
    }
  }
  for (const item of catalog.components.filter((c) => c.category === slug)) {
    if (item.image && assetExists(item.image)) return item.image;
  }
  const slide = CATEGORY_COVER_SLIDE[slug];
  if (slide && assetExists(slide)) return slide;
  return null;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell({ base, title, desc, main, pageId = '', catalogMode = '', detailPage = false }) {
  const catalogAttr = catalogMode ? ` data-catalog-mode="${catalogMode}"` : '';
  const detailScripts = detailPage
    ? `\n  <script src="${base}js/product-detail-render.js"></script>
  <script>document.addEventListener('DOMContentLoaded',function(){
    if(window.SciEngProductDetail)window.SciEngProductDetail.initInteractions(document);
    if(window.SciEngCartUI)window.SciEngCartUI.init(document);
  });</script>`
    : '';
  return `<!DOCTYPE html>
<html lang="en" data-base="${base}" data-page="${pageId}"${catalogAttr}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="${base}assets/favicon.png" type="image/png" />
  <link rel="apple-touch-icon" href="${base}assets/favicon.png" />
  <title>${esc(title)} | SciEngTech</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${base}css/site.css" />
  <link rel="stylesheet" href="${base}css/catalog.css" />
</head>
<body>
  <div id="site-header"></div>
  <main>${main}</main>
  <div id="site-footer"></div>
  <div id="site-search"></div>
  <script>window.__SITE_BASE__ = ${JSON.stringify(base)};</script>
  <script src="${base}js/catalog-search.js"></script>
  <script src="${base}js/quote-cart.js"></script>
  <script src="${base}js/cart-ui.js"></script>
  <script src="${base}js/header-search.js"></script>
  <script src="${base}js/site-chrome.js"></script>${detailScripts}
</body>
</html>`;
}

function syncDerivedData(c) {
  const products = {
    version: c.version,
    updated: c.updated,
    count: c.components.length,
    products: c.components,
  };
  const searchIndex = {
    version: c.version,
    updated: c.updated,
    items: [...c.solutions, ...c.components].map((p) => ({
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
      url: p.solutionUrl || componentProductUrl(p.id, ''),
      _search: p._search,
      featured: p.type === 'solution',
    })),
  };
  fs.writeFileSync(path.join(ROOT, 'data/products.json'), JSON.stringify(products, null, 2));
  fs.writeFileSync(path.join(ROOT, 'data/search-index.json'), JSON.stringify(searchIndex, null, 2));
}

function catalogBrowseMain({ title, subtitle, placeholder, showTypeFilters }) {
  const total = catalog.solutions.length + catalog.components.length;
  const typeRow = showTypeFilters
    ? `<div class="catalog-toolbar-row">
        <span class="catalog-filter-row-label">Type</span>
        <div class="catalog-filters" id="catalogTypeFilters"></div>
      </div>`
    : '';
  return `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>${esc(title)}</h1>
      <p>${esc(subtitle)}</p>
      <div class="catalog-toolbar">
        <div class="catalog-toolbar-row">
          <input type="search" class="catalog-search-input" id="catalogSearchInput" placeholder="${esc(placeholder)}" autocomplete="off" />
        </div>
        ${typeRow}
        <div class="catalog-toolbar-row">
          <span class="catalog-filter-row-label">Category</span>
          <div class="catalog-filters" id="catalogFilters"></div>
        </div>
      </div>
      <p class="catalog-meta" id="catalogCount">Loading…</p>
      <div class="product-grid" id="productGrid"></div>
    </div>
  </section>`;
}

function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('  wrote', rel);
}

function componentProductUrl(id, linkBase) {
  // Hash URL survives dev servers that strip ?id= when rewriting product.html → /product
  return `${linkBase}product.html#${encodeURIComponent(id)}`;
}

function cleanLegacyProductPages() {
  const legacyDir = path.join(ROOT, 'products');
  if (!fs.existsSync(legacyDir)) return;
  for (const name of fs.readdirSync(legacyDir)) {
    if (!name.endsWith('.html')) continue;
    const id = name.replace(/\.html$/i, '');
    const rel = `products/${name}`;
    write(
      rel,
      `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="refresh" content="0;url=../product.html#${encodeURIComponent(id)}" /><title>Redirect</title></head><body><p><a href="../product.html#${encodeURIComponent(id)}">View specification</a></p></body></html>`
    );
  }
  console.log('  legacy products/*.html → redirect to product.html#id');
}

function productCard(p, linkBase, assetBase, solutionPrefix) {
  if (assetBase === undefined) assetBase = linkBase;
  if (solutionPrefix === undefined) solutionPrefix = 'solutions/';
  const url =
    p.type === 'solution'
      ? `${linkBase}${solutionPrefix}${p.id}.html`
      : componentProductUrl(p.id, linkBase);
  const media = p.image
    ? `<img src="${assetBase}${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />`
    : '<span class="placeholder" aria-hidden="true">◇</span>';
  return `<a class="product-card" href="${url}">
    <div class="product-card-media">${media}</div>
    <div class="product-card-body">
      <span class="product-card-cat">${esc(p.categoryLabel || (p.solutionGroup ? solutionGroupLabel(p.solutionGroup) : 'Solution'))}</span>
      <h2>${esc(p.name.replace(/^['']|['']$/g, ''))}</h2>
      <span class="product-card-spec">${esc(p.specHighlight)}</span>
      <span class="product-card-sku mono">${esc(p.sku)}</span>
    </div>
  </a>`;
}

function solutionDetailPage(s, base) {
  const main = renderProductDetail(s, { base });

  return shell({
    base,
    title: s.name.replace(/^['']|['']$/g, ''),
    desc: s.summary,
    main,
    pageId: 'solution',
    detailPage: true,
  });
}

function categoryPage(cat, items, base) {
  const grid = items.map((p) => productCard(p, base, base, '')).join('\n');
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <nav class="product-breadcrumb">
        <a href="${base}index.html">Home</a> / <a href="${base}components.html">Components</a> / <span>${esc(cat.label)}</span>
      </nav>
      <h1>${esc(cat.label)}</h1>
      <p>${items.length} spec-verified component${items.length === 1 ? '' : 's'} from the SciEngTech technical catalog. Request a quote for quantities and custom configurations.</p>
      <p class="catalog-meta">${items.length} components</p>
      <div class="product-grid">${grid}</div>
    </div>
  </section>`;
  return shell({
    base,
    title: cat.label,
    desc: `${cat.label} components for quantum and photonics labs.`,
    main,
    pageId: 'category',
  });
}

// --- Homepage ---
const SLIDE_PLACEHOLDERS = [
  'assets/slides/01-translation-stage.svg',
  'assets/slides/02-kinematic-mirror-mount.svg',
  'assets/slides/03-dielectric-mirror.svg',
  'assets/slides/04-vacuum-flange.svg',
  'assets/slides/05-photodetector-module.svg',
  'assets/slides/06-optical-breadboard.svg',
];

/** WaveSpeed homepage hero images — 5 quantum carousel + 6 category tiles */
const HOME_QUANTUM_IMAGES = {
  'entangled-photon-source': 'assets/homepage/quantum/01-entangled-photon-source.webp',
  'hbt-and-hom': 'assets/homepage/quantum/02-hbt-and-hom.webp',
  'quantum-key-distribution': 'assets/homepage/quantum/03-quantum-key-distribution.webp',
  'quantum-tomography': 'assets/homepage/quantum/04-quantum-tomography.webp',
  'michelson-interferometer': 'assets/homepage/quantum/05-michelson-interferometer.webp',
};

const HOME_CATEGORY_IMAGES = {
  optics: 'assets/homepage/categories/01-optics.webp',
  'opto-mechanics': 'assets/homepage/categories/02-opto-mechanics.webp',
  'motion-and-positioning': 'assets/homepage/categories/03-motion-and-positioning.webp',
  lasers: 'assets/homepage/categories/04-lasers.webp',
  'fibre-optics': 'assets/homepage/categories/05-fibre-optics.webp',
  hardware: 'assets/homepage/categories/06-hardware.webp',
  'quantum-technology': 'assets/homepage/categories/07-quantum-technology.webp',
  'quantum-education': 'assets/homepage/categories/08-quantum-education.webp',
  'photonics-training': 'assets/homepage/categories/09-photonics-training.webp',
  'customised-solutions': 'assets/homepage/categories/10-customised-solutions.webp',
};

const HOME_CATEGORY_IMAGE_FALLBACKS = {
  'quantum-technology': 'assets/homepage/quantum/01-entangled-photon-source.webp',
  'quantum-education': 'assets/homepage/quantum/03-quantum-key-distribution.webp',
  'photonics-training': 'assets/homepage/quantum/05-michelson-interferometer.webp',
  'customised-solutions': 'assets/homepage/quantum/02-hbt-and-hom.webp',
};

function placeholderSlide(index) {
  return SLIDE_PLACEHOLDERS[index % SLIDE_PLACEHOLDERS.length];
}

function homeCategoryCover(cat, index) {
  const candidates = [
    HOME_CATEGORY_IMAGES[cat.slug],
    HOME_CATEGORY_IMAGE_FALLBACKS[cat.slug],
    categoryCoverImage(cat.slug),
    placeholderSlide(index),
  ];
  for (const cover of candidates) {
    if (cover && assetExists(cover)) return cover;
  }
  return placeholderSlide(index);
}

function componentCategoryQuicklinks() {
  const tiles = HOME_CATEGORIES.map((cat, i) => {
    const cover = homeCategoryCover(cat, i);
    return `<a class="category-tile" href="${esc(cat.href)}" aria-label="${esc(cat.label)}">
      <span class="category-tile__media">
        <img src="${esc(cover)}" alt="" loading="lazy" />
        <span class="category-tile__label">${esc(cat.label)}</span>
      </span>
    </a>`;
  }).join('\n');
  return `<div class="hero-categories category-quicklinks" aria-label="Browse components by category">
    <div class="wrap">
      <div class="category-quicklinks__head">
        <h2>Browse by Category</h2>
        <a class="category-quicklinks__all" href="components.html">All Components →</a>
      </div>
      <div class="category-quicklinks__grid">${tiles}</div>
    </div>
  </div>`;
}

function homeClosingSections() {
  return `<section class="data-proof" aria-label="Quality and compliance">
    <div class="wrap quality-proof">
      <div class="quality-proof__intro">
        <h2>Rigorous compliance. Guaranteed field performance.</h2>
      </div>
      <div class="credential-bar" role="list">
        <article class="credential-badge" role="listitem">
          <img class="credential-badge__logo" src="assets/credentials/make-in-india.svg" alt="" width="120" height="48" />
          <h3>Made in India</h3>
        </article>
        <article class="credential-badge" role="listitem">
          <img class="credential-badge__logo" src="assets/credentials/iso-certified.svg" alt="" width="120" height="48" />
          <h3>ISO 9001:2015</h3>
        </article>
        <article class="credential-badge" role="listitem">
          <img class="credential-badge__logo" src="assets/credentials/gem-vendor.svg" alt="" width="120" height="48" />
          <h3>GeM Vendor</h3>
        </article>
        <article class="credential-badge" role="listitem">
          <img class="credential-badge__logo" src="assets/credentials/quality-inspected.svg" alt="" width="120" height="48" />
          <h3>Every unit checked before dispatch</h3>
        </article>
      </div>
      <div class="quality-proof__body">
        <div class="quality-commitments">
          <article class="quality-commitment">
            <h3>Specification review</h3>
            <p>All configurations and Bill of Materials line items will be reviewed and confirmed against your application requirements prior to the commencement of engineering and production.</p>
          </article>
          <article class="quality-commitment">
            <h3>Pre-dispatch inspection</h3>
            <p>Optical alignment, mechanical fit, and system functionality are verified on every unit before shipment.</p>
          </article>
          <article class="quality-commitment">
            <h3>Procurement documentation</h3>
            <p>GSTIN, UDYAM, and GeM vendor credentials supplied for institutional and government purchase workflows.</p>
          </article>
        </div>
        <div class="spec-table quality-record">
          <header>PROCUREMENT &amp; COMPLIANCE RECORD</header>
          <div class="spec-row"><span>Legal entity</span><span>SciEngTech Solutions LLP</span></div>
          <div class="spec-row"><span>Origin</span><span>India · Pune · Mumbai</span></div>
          <div class="spec-row"><span>GSTIN</span><span class="mono">27AEOFS5239R1ZY</span></div>
          <div class="spec-row"><span>UDYAM</span><span class="mono">UDYAM-MH-26-0215820</span></div>
          <div class="spec-row"><span>GeM status</span><span>Approved vendor</span></div>
          <div class="spec-row"><span>Inspection</span><span class="spec-pass">PASS · 100% inspected</span></div>
        </div>
      </div>
    </div>
  </section>
  <section class="cta-band">
    <div class="wrap">
      <h2>Ready to configure your lab requirements?</h2>
      <p>Request a technical quote for quantum systems and bench components.</p>
      <div class="hero-ctas">
        <a class="btn btn-ruby" href="engineering/rfq.html">Request Technical Quote</a>
        <a class="btn btn-outline" href="company/contact.html">Contact System Engineer</a>
      </div>
    </div>
  </section>
  <script src="js/home-carousel.js"></script>`;
}

function buildHomepageMain() {
  const quantum = catalog.solutions.filter((s) => s.solutionGroup === 'quantum-setups');
  const slides = quantum.slice(0, 5);
  const slideHtml = slides
    .map((s, i) => {
      const img = HOME_QUANTUM_IMAGES[s.id] || s.image || placeholderSlide(i);
      const title = s.name.replace(/^['']|['']$/g, '');
      const href = s.solutionUrl || `solutions/${s.id}.html`;
      return `<div class="carousel-slide${i === 0 ? ' is-active' : ''}" data-title="${esc(title)}" data-spec="${esc(s.specHighlight)}" data-href="${esc(href)}">
        <a href="${esc(href)}" class="carousel-slide-link" aria-label="${esc(title)}"><img src="${esc(img)}" alt="${esc(title)}" /></a>
      </div>`;
    })
    .join('\n');
  const thumbs = slides
    .map(
      (s, i) =>
        `<button type="button" class="carousel-thumb${i === 0 ? ' is-active' : ''}" data-index="${i}"><img src="${esc(HOME_QUANTUM_IMAGES[s.id] || s.image || placeholderSlide(i))}" alt="" /></button>`
    )
    .join('\n');

  return `<section class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="overline">Quantum Optics Infrastructure</div>
        <h1>Laser, Photonics, Integrated Quantum System for research and Education</h1>
        <p>SciEngTech engineers laser, entangled photon source, quantum demonstration set-ups, and training kits — supported by a full bench-component catalog for optical assembly.</p>
        <div class="hero-ctas">
          <a class="btn btn-ruby" href="engineering/rfq.html">Request Technical Quote</a>
          <a class="btn btn-outline" href="solutions.html">Explore Quantum Solutions</a>
        </div>
      </div>
      <div class="hero-carousel" id="heroCarousel" aria-label="Quantum solutions showcase">
        <div class="carousel-viewport">
          <span class="carousel-counter" id="carouselCounter">01 / ${String(slides.length).padStart(2, '0')}</span>
          <button type="button" class="carousel-btn prev" id="carouselPrev" aria-label="Previous slide">‹</button>
          <button type="button" class="carousel-btn next" id="carouselNext" aria-label="Next slide">›</button>
          ${slideHtml}
          <p class="carousel-disclaimer">Images shown are representative.</p>
        </div>
        <a class="carousel-meta" id="carouselMeta" href="${esc(slides[0]?.solutionUrl || `solutions/${slides[0]?.id}.html` || 'solutions.html')}">
          <span class="slide-title" id="carouselTitle">${esc(slides[0]?.name.replace(/^['']|['']$/g, '') || '')}</span>
          <span class="slide-spec" id="carouselSpec">${esc(slides[0]?.specHighlight || '')}</span>
        </a>
        <div class="carousel-thumbs" id="carouselThumbs">${thumbs}</div>
      </div>
    </div>
    ${componentCategoryQuicklinks()}
  </section>
  <section class="proof" aria-label="Institutional clients">
    <div class="wrap proof-inner">
      <p class="proof-overline">Institutional reach</p>
      <div class="client-sectors">
        <span class="client-sector">IITs</span>
        <span class="client-sector">IISERs</span>
        <span class="client-sector">Universities</span>
        <span class="client-sector">Defence Labs</span>
        <span class="client-sector">Space Labs</span>
        <span class="client-sector">Industries</span>
      </div>
    </div>
  </section>
  ${homeClosingSections()}`;
}

function buildHomepage() {
  write(
    'index.html',
    shell({
      base: '',
      title: 'Quantum Optics Systems & Photonics Hardware',
      desc: 'Integrated quantum set-ups, training kits, and bench components for research and education. Request a technical quote.',
      main: buildHomepageMain(),
      pageId: 'home',
    })
  );
}

function buildSolutionsHub(base, rel) {
  const q = catalog.solutions.filter((s) => s.solutionGroup === 'quantum-setups');
  const t = catalog.solutions.filter((s) => s.solutionGroup === 'training-kits');
  const sota = catalog.solutions.filter((s) => s.solutionGroup === 'state-of-the-art-setups');
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>Quantum &amp; Photonics Solutions</h1>
      <p>Turnkey quantum demonstration systems, educational kits, and state-of-the-art photonics setups — specified, validated, and supported by SciEngTech engineering.</p>
      <h2 class="hub-section-title">Quantum Set-Ups</h2>
      <div class="product-grid">${q.map((p) => productCard(p, '', '', 'solutions/')).join('')}</div>
      <h2 class="hub-section-title" style="margin-top:48px">State of the Art Setups</h2>
      <div class="product-grid">${sota.map((p) => productCard(p, '', '', 'solutions/')).join('')}</div>
      <h2 class="hub-section-title" style="margin-top:48px">Training &amp; Education Kits</h2>
      <div class="product-grid">${t.map((p) => productCard(p, '', '', 'solutions/')).join('')}</div>
    </div>
  </section>`;
  write(rel, shell({ base, title: 'Solutions', desc: 'Quantum set-ups, state-of-the-art systems, and training kits.', main, pageId: 'solutions' }));
}

function buildSubHub(rel, title, desc, group) {
  const items = catalog.solutions.filter((s) => s.solutionGroup === group);
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <nav class="product-breadcrumb"><a href="../index.html">Home</a> / <a href="../solutions.html">Solutions</a> / <span>${esc(title)}</span></nav>
      <h1>${esc(title)}</h1>
      <p>${esc(desc)}</p>
      <div class="product-grid">${items.map((p) => productCard(p, '', '../', '')).join('')}</div>
    </div>
  </section>`;
  write(rel, shell({ base: '../', title, desc, main }));
}

function buildComponentsHub(base, rel) {
  const cards = CATEGORIES.map((cat) => {
    const count = catalog.components.filter((c) => c.category === cat.slug).length;
    const cover = categoryCoverImage(cat.slug);
    const media = cover
      ? `<div class="pillar-media"><img src="${base}${esc(cover)}" alt="${esc(cat.label)}" loading="lazy" /></div>`
      : `<div class="pillar-media pillar-media--empty" aria-hidden="true"><span>◇</span></div>`;
    return `<a class="pillar pillar--category" href="${base}components/${cat.slug}.html">
      ${media}
      <div class="pillar-body">
        <div class="pillar-num">${String(count).padStart(2, '0')}</div>
        <h3>${esc(cat.label.toUpperCase())}</h3>
        <p>${count} spec-verified component${count === 1 ? '' : 's'}.</p>
        <span class="pillar-link">View category →</span>
      </div>
    </a>`;
  }).join('');
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>Technical Component Catalog</h1>
      <p>Bench hardware supporting quantum and photonics assembly — ${catalog.components.length} components across six engineering categories.</p>
      <p style="margin-top:-12px"><a href="${base}catalog.html" style="color:var(--accent);font-weight:600">Search all ${catalog.solutions.length + catalog.components.length} catalog items →</a></p>
      <div class="pillar-grid" style="margin-top:32px">${cards}</div>
    </div>
  </section>`;
  write(rel, shell({ base, title: 'Components', desc: 'Quantum bench component catalog.', main, pageId: 'components' }));
}

function buildCompanyPage(base, rel, title, content) {
  write(rel, shell({ base, title, desc: title, main: content }));
}

function buildCheckoutPage() {
  const base = '../';
  const main = `<section class="page-content checkout-page" id="checkoutPage">
    <div class="wrap">
      <h1>Checkout</h1>
      <p class="lead">Review your cart and submit your contact details. Our engineering team will respond with specifications and lead times.</p>
      <div class="checkout-layout">
        <div class="checkout-panel checkout-panel--cart">
          <div class="checkout-panel-head">
            <h2>Your Cart</h2>
            <button type="button" class="checkout-clear-link" id="checkoutClearCart">Clear all</button>
          </div>
          <div id="checkoutCartEmpty" class="checkout-empty" hidden>
            <p>Your cart is empty.</p>
            <a class="btn btn-ruby" href="../catalog.html">Browse Catalog</a>
          </div>
          <div id="checkoutCartList" class="checkout-cart-list"></div>
        </div>
        <div class="checkout-panel checkout-panel--form" id="checkoutFormWrap" hidden>
          <h2>Contact Details</h2>
          <p class="checkout-form-hint">Fields marked <span class="req">*</span> are required.</p>
          <div id="checkoutFormConfigWarn" class="checkout-config-warn" hidden>
            <strong>Form not wired yet.</strong> Create the Google Form, then add the form ID and entry IDs in <code>js/google-form-config.js</code>.
          </div>
          <form id="checkoutForm" class="checkout-form" novalidate>
            <div class="checkout-field"><label for="fullName">Full Name <span class="req">*</span></label><input type="text" id="fullName" name="fullName" required autocomplete="name" /></div>
            <div class="checkout-field"><label for="email">Email <span class="req">*</span></label><input type="email" id="email" name="email" required autocomplete="email" /></div>
            <div class="checkout-field"><label for="institute">Institute / Organization</label><input type="text" id="institute" name="institute" autocomplete="organization" /></div>
            <div class="checkout-field"><label for="phone">Phone Number</label><input type="tel" id="phone" name="phone" autocomplete="tel" /></div>
            <div class="checkout-field"><label for="designation">Designation / Role</label><input type="text" id="designation" name="designation" autocomplete="organization-title" /></div>
            <div class="checkout-field"><label for="notes">Additional Notes</label><textarea id="notes" name="notes" rows="4" placeholder="Application requirements, timeline, quantities, delivery location…"></textarea></div>
            <p id="checkoutFormError" class="checkout-form-error" hidden></p>
            <button type="submit" class="btn btn-ruby checkout-submit">Submit Quote Request</button>
            <p class="checkout-form-foot">By submitting, you agree to be contacted regarding this quote request. No payment is collected on this site.</p>
          </form>
        </div>
      </div>
    </div>
  </section>`;
  const page = shell({
    base,
    title: 'Checkout — Request Technical Quote',
    desc: 'Review your cart and submit a technical quote request.',
    main,
    pageId: 'checkout',
  });
  write(
    'engineering/rfq.html',
    page.replace(
      '</body>',
      `  <script src="${base}js/google-form-config.js"></script>
  <script src="${base}js/rfq-page.js"></script>
</body>`
    )
  );
}

function main() {
  console.log('Building site pages...');
  fs.writeFileSync(path.join(ROOT, 'data/catalog.json'), JSON.stringify(catalog, null, 2));
  syncDerivedData(catalog);
  buildHomepage();

  buildSolutionsHub('', 'solutions.html');
  buildSubHub('solutions/quantum-setups.html', 'Quantum Set-Ups', SOLUTION_GROUPS['quantum-setups'].hubDesc, 'quantum-setups');
  buildSubHub('solutions/state-of-the-art-setups.html', 'State of the Art Setups', SOLUTION_GROUPS['state-of-the-art-setups'].hubDesc, 'state-of-the-art-setups');
  buildSubHub('solutions/training-kits.html', 'Training & Education Kits', SOLUTION_GROUPS['training-kits'].hubDesc, 'training-kits');

  for (const s of catalog.solutions) {
    write(`solutions/${s.id}.html`, solutionDetailPage(s, '../'));
  }

  buildComponentsHub('', 'components.html');
  for (const cat of CATEGORIES) {
    const items = catalog.components.filter((c) => c.category === cat.slug);
    write(`components/${cat.slug}.html`, categoryPage(cat, items, '../'));
  }

  // Full catalog — solutions + components with search and filters
  const catalogMain = catalogBrowseMain({
    title: 'Full Technical Catalog',
    subtitle: `Search and filter all ${catalog.solutions.length + catalog.components.length} solutions and bench components across every category.`,
    placeholder: 'Search solutions, components, SKUs, specifications…',
    showTypeFilters: true,
  });
  const catalogPage = shell({
    base: '',
    title: 'Full Catalog',
    desc: 'Search all SciEngTech solutions and components.',
    main: catalogMain,
    pageId: 'catalog',
    catalogMode: 'full',
  });
  write(
    'catalog.html',
    catalogPage.replace('</body>', '  <script src="js/catalog-page.js"></script>\n</body>')
  );

  // Component-only search (shortcut to filtered full catalog)
  const compMain = catalogBrowseMain({
    title: 'Search Components',
    subtitle: `Filter and search ${catalog.components.length} bench components.`,
    placeholder: 'Search components, specifications…',
    showTypeFilters: false,
  });
  const compPage = shell({
    base: '../',
    title: 'Component Search',
    desc: 'Search component catalog',
    main: compMain,
    pageId: 'catalog-search',
    catalogMode: 'components',
  });
  write(
    'components/search.html',
    compPage.replace('</body>', '  <script src="../js/catalog-page.js"></script>\n</body>')
  );

  // product.html — single dynamic component detail page (query: ?id=slug)
  const prodMain = `<section class="product-detail" id="productMain"><div class="wrap"><p class="catalog-meta">Loading…</p></div></section>`;
  const prodPage = shell({ base: '', title: 'Component Spec', desc: 'Component specification', main: prodMain });
  write(
    'product.html',
    prodPage.replace(
      '</body>',
      '  <script src="js/product-detail-render.js"></script>\n  <script src="js/product-page.js"></script>\n</body>'
    )
  );

  // Company & engineering
  buildCompanyPage('../', 'company/about.html', 'About Us', `<section class="page-content about-page"><div class="wrap about-wrap">
    <h1>About SciEngTech Solutions</h1>
    <p class="lead">SciEngTech Solutions LLP engineers quantum optics systems, educational photonics kits, and precision bench hardware from Pune, India.</p>
    <div class="about-prose">
      <p>SciEngTech Solutions LLP builds the instruments and bench hardware that India's research labs, universities, and training centres use to teach and demonstrate quantum optics. From entangled photon sources and QKD demonstration platforms to Fourier optics kits and opto-mechanical assemblies, our work spans turnkey quantum set-ups and the components that hold an optical table together.</p>
      <p>We engineer and manufacture in Pune. Every system is specified for real laboratory use — not catalog placeholders — and validated before dispatch. Our processes are ISO 9001:2015 certified, every unit is quality inspected, and we are an approved vendor on the Government e-Marketplace (GeM) for institutional procurement.</p>
      <p>Institutions across India — IITs, IISERs, universities, defence laboratories, and industry R&amp;D groups — rely on SciEngTech for equipment that must perform reliably in teaching and research environments. When you request a quote, you work directly with our engineering team on configurations, lead times, and documentation suited to your procurement workflow.</p>
    </div>
    <h2 class="about-section-title">Our team</h2>
    <div class="about-team">
      <article class="about-team-card">
        <h3>Sayali Lad</h3>
        <p class="about-team-role">Design, Production &amp; Quality Assurance</p>
        <p>Sayali holds an M.Sc. in Physics from the University of Pune and is an alumna of the Department of Astrophysics and Astronomy at TIFR Mumbai. She worked on the AstroSat mission and brings five years of experience in optics and satellite data analysis.</p>
        <p>She leads product design, manufacturing, and quality assurance — from specification review through assembly to pre-dispatch inspection.</p>
      </article>
      <article class="about-team-card">
        <h3>Jasmine Ved</h3>
        <p class="about-team-role">Sales, Accounting &amp; Marketing</p>
        <p>Jasmine holds a B.Com and B.Ed. from the University of Mumbai. She spent over ten years as a science and mathematics teacher at CNS International School, Mumbai.</p>
        <p>She leads sales, accounting, and marketing, guiding institutional customers from inquiry through quotation and delivery.</p>
      </article>
    </div>
  </div></section>`);

  buildCompanyPage('../', 'company/contact.html', 'Contact', `<section class="page-content"><div class="wrap">
    <h1>Contact &amp; Credentials</h1>
    <div class="contact-grid">
      <div><h3>Pune Headquarters</h3><p>14, Om Shanti, 156/2 Mangalwar Peth<br>Pune – 411 011, India</p><p><a href="mailto:info@sciengtech.in">info@sciengtech.in</a></p></div>
      <div><h3>Credentials</h3>
        <p><strong>GSTIN:</strong> 27AEOFS5239R1ZY</p>
        <p><strong>UDYAM:</strong> UDYAM-MH-26-0215820</p>
        <p><strong>GeM:</strong> Approved vendor</p>
        <p><strong>Quality:</strong> ISO 9001:2015 · 100% Quality Inspected · Made in India</p>
      </div>
      <div><h3>Engineering</h3><p><a href="../engineering/rfq.html">Request Technical Quote</a></p></div>
    </div>
  </div></section>`);

  buildCompanyPage('../', 'company/legal/terms.html', 'Terms & Conditions', `<section class="page-content"><div class="wrap legal-prose">
    <h1>Terms &amp; Conditions</h1>
    <p class="lead">These terms govern use of sciengtech.in and technical quote requests submitted to SciEngTech Solutions LLP.</p>
    <h2>1. Scope</h2>
    <p>This website is a technical catalog and request-for-quote (RFQ) portal. Product specifications are provided for engineering evaluation. All orders are subject to written quotation, acceptance, and purchase order terms.</p>
    <h2>2. No online sale</h2>
    <p>SciEngTech does not offer e-commerce checkout on this site. Prices, lead times, configurations, and compliance documentation are confirmed only through an official quotation from our engineering or sales team.</p>
    <h2>3. Specifications</h2>
    <p>We endeavour to keep specifications accurate and current. Dimensions, coatings, wavelengths, and performance figures may be updated without notice. Critical applications should be confirmed with our engineering team before procurement.</p>
    <h2>4. Quotes &amp; orders</h2>
    <p>RFQ submissions do not constitute an order or price guarantee until a formal quotation is issued and accepted. Quotations may specify validity periods, payment terms, and delivery conditions.</p>
    <h2>5. Intellectual property</h2>
    <p>Site content, product imagery, documentation, and branding are owned by SciEngTech Solutions LLP unless otherwise stated. Schematics uploaded by customers remain the customer's property; you grant SciEngTech a limited licence to review files for quotation and engineering purposes.</p>
    <h2>6. Limitation of liability</h2>
    <p>To the extent permitted by law, SciEngTech is not liable for indirect or consequential loss arising from use of this website or reliance on preliminary catalog data. Product liability and warranty terms are defined in the applicable sales contract.</p>
    <h2>7. Governing law</h2>
    <p>These terms are governed by the laws of India. Courts at Pune, Maharashtra shall have exclusive jurisdiction, subject to mandatory institutional procurement rules applicable to the buyer.</p>
    <h2>8. Contact</h2>
    <p>Questions: <a href="mailto:info@sciengtech.in">info@sciengtech.in</a> · <a href="../contact.html">Contact &amp; Credentials</a></p>
    <p><em>Last updated: July 2026</em></p>
  </div></section>`);

  buildCompanyPage('../', 'company/legal/privacy.html', 'Privacy Policy', `<section class="page-content"><div class="wrap legal-prose">
    <h1>Privacy Policy</h1>
    <p class="lead">How SciEngTech Solutions LLP collects and uses information submitted through sciengtech.in.</p>
    <h2>1. Who we are</h2>
    <p>SciEngTech Solutions LLP (SciEngTech), Pune, India. Contact: <a href="mailto:info@sciengtech.in">info@sciengtech.in</a>.</p>
    <h2>2. Information we collect</h2>
    <p>When you request a technical quote or contact us, we may collect: name, work email, organisation, phone, project details, BOM information, and correspondence related to your inquiry.</p>
    <h2>3. How we use information</h2>
    <p>We use submitted information to respond to RFQs, prepare quotations, verify custom drawings, fulfil orders, and improve our catalog. We do not sell personal data.</p>
    <h2>4. Forms &amp; email</h2>
    <p>RFQ submissions may use Google Forms or email routed to info@sciengtech.in. Data processed through those channels is handled according to this policy and our contractual obligations to institutional customers.</p>
    <h2>5. Retention</h2>
    <p>Engineering submissions and quotation records are retained as needed for business, quality, and legal purposes, including institutional audit requirements.</p>
    <h2>6. Security</h2>
    <p>We apply reasonable technical and organisational measures to protect submitted data. No transmission over the internet is completely secure; sensitive classified programmes should use agreed secure channels with our team.</p>
    <h2>7. Your rights</h2>
    <p>You may request access, correction, or deletion of personal data where applicable under Indian law. Contact <a href="mailto:info@sciengtech.in">info@sciengtech.in</a>.</p>
    <h2>8. Analytics</h2>
    <p>We may use privacy-respecting analytics (e.g. Google Analytics 4) to measure site usage. You will be notified when analytics is enabled on the production domain.</p>
    <h2>9. Changes</h2>
    <p>We may update this policy. Material changes will be reflected on this page with an updated date.</p>
    <p><em>Last updated: July 2026</em></p>
  </div></section>`);

  buildCheckoutPage();

  buildKnowledgePages({ shell, write });

  buildCompanyPage('', 'thank-you.html', 'Thank You', `<section class="page-content page-content--center"><div class="wrap">
    <h1>Submission received</h1>
    <p class="lead">Your request has been received. Our engineering team will respond with a reference number and next steps.</p>
    <div class="hero-ctas" style="justify-content:center;margin-top:32px">
      <a class="btn btn-ruby" href="index.html">Return Home</a>
      <a class="btn btn-outline" href="solutions.html">Browse Solutions</a>
    </div>
  </div></section>`);

  buildCompanyPage('', '404.html', 'Page Not Found', `<section class="page-content page-content--center"><div class="wrap">
    <h1>Page not found</h1>
    <p class="lead">Browse the quantum solutions catalog or submit an RFQ for custom requirements.</p>
    <div class="hero-ctas" style="justify-content:center;margin-top:32px">
      <a class="btn btn-ruby" href="solutions.html">Quantum Solutions</a>
      <a class="btn btn-outline" href="components.html">Components</a>
    </div>
  </div></section>`);

  // Redirect legacy products.html to full catalog
  write(
    'products.html',
    `<!DOCTYPE html><html><head><meta charset="UTF-8" /><link rel="icon" href="assets/favicon.png" type="image/png" /><meta http-equiv="refresh" content="0;url=catalog.html" /><title>Redirect</title></head><body><p><a href="catalog.html">Full catalog</a></p></body></html>`
  );

  cleanLegacyProductPages();

  buildSitemapAndRobots();

  console.log('Done.');
}

function buildSitemapAndRobots() {
  const base = 'https://sciengtech.in';
  const urls = [
    '',
    'solutions.html',
    'solutions/quantum-setups.html',
    'solutions/state-of-the-art-setups.html',
    'solutions/training-kits.html',
    'components.html',
    'catalog.html',
    'components/search.html',
    'company/about.html',
    'company/contact.html',
    'company/legal/terms.html',
    'company/legal/privacy.html',
    'engineering/rfq.html',
    'engineering/knowledge/index.html',
    'thank-you.html',
  ];
  if (fs.existsSync(path.join(ROOT, 'data/knowledge.json'))) {
    const k = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/knowledge.json'), 'utf8'));
    for (const a of k.articles || []) urls.push(`engineering/knowledge/${a.id}.html`);
  }
  for (const s of catalog.solutions) urls.push(`solutions/${s.id}.html`);
  for (const c of CATEGORIES) urls.push(`components/${c.slug}.html`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}/${u}</loc></url>`).join('\n')}
</urlset>`;
  write('sitemap.xml', xml);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
}

main();
