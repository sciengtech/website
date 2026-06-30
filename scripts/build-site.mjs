/**
 * Build static HTML pages from catalog data.
 * Run: node scripts/build-site.mjs (after ingest-writeup.mjs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));

const CATEGORIES = [
  { slug: 'opto-mechanics', label: 'Opto-Mechanics' },
  { slug: 'motion-and-positioning', label: 'Motion and Positioning' },
  { slug: 'hardware', label: 'Hardware' },
  { slug: 'fibre-optics', label: 'Fibre Optics' },
  { slug: 'lasers', label: 'Lasers' },
  { slug: 'optics', label: 'Optics' },
];

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell({ base, title, desc, main, pageId = '' }) {
  return `<!DOCTYPE html>
<html lang="en" data-base="${base}" data-page="${pageId}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} | SciEngTech</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
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
  <script src="${base}js/header-search.js"></script>
  <script src="${base}js/site-chrome.js"></script>
</body>
</html>`;
}

function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('  wrote', rel);
}

function productCard(p, base) {
  const url =
    p.type === 'solution'
      ? `${base}solutions/${p.id}.html`
      : `${base}product.html?id=${encodeURIComponent(p.id)}`;
  const media = p.image
    ? `<img src="${base}${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />`
    : '<span class="placeholder" aria-hidden="true">◇</span>';
  return `<a class="product-card" href="${url}">
    <div class="product-card-media">${media}</div>
    <div class="product-card-body">
      <span class="product-card-cat">${esc(p.categoryLabel || (p.solutionGroup === 'training-kits' ? 'Training Kit' : 'Quantum Set-Up'))}</span>
      <h2>${esc(p.name.replace(/^['']|['']$/g, ''))}</h2>
      <span class="product-card-spec">${esc(p.specHighlight)}</span>
      <span class="product-card-sku mono">${esc(p.sku)}</span>
    </div>
  </a>`;
}

function solutionDetailPage(s, base) {
  const specs = s.specs
    .map((r) => `<div class="spec-row"><span>${esc(r.label)}</span><span>${esc(r.value)}</span></div>`)
    .join('');
  const media = s.image
    ? `<img src="${base}${esc(s.image)}" alt="${esc(s.name)}" />`
    : '<span class="placeholder" aria-hidden="true">◇</span>';
  const groupLabel = s.solutionGroup === 'training-kits' ? 'Training Kits' : 'Quantum Set-Ups';
  const groupUrl =
    s.solutionGroup === 'training-kits'
      ? `${base}solutions/training-kits.html`
      : `${base}solutions/quantum-setups.html`;
  const bodyParas = s.body
    .split(/\n\n+/)
    .slice(1, 6)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');

  const main = `<section class="product-detail">
    <div class="wrap">
      <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a href="${base}index.html">Home</a> /
        <a href="${base}solutions.html">Solutions</a> /
        <a href="${groupUrl}">${groupLabel}</a> /
        <span>${esc(s.name.replace(/^['']|['']$/g, ''))}</span>
      </nav>
      <div class="product-detail-grid">
        <div class="product-detail-media">${media}</div>
        <div>
          <p class="product-overline">${groupLabel}</p>
          <h1>${esc(s.name.replace(/^['']|['']$/g, ''))}</h1>
          <p class="product-sku-line mono">SKU: ${esc(s.sku)}</p>
          <p class="product-highlight mono">${esc(s.specHighlight)}</p>
          <div class="product-summary">${bodyParas}</div>
          <div class="spec-table-detail">
            <header>SYSTEM SPECIFICATION</header>
            ${specs}
          </div>
          <div class="product-ctas">
            <a class="btn btn-ruby" href="${base}engineering/rfq.html?product=${encodeURIComponent(s.id)}">Request Technical Quote</a>
            <a class="btn btn-outline" href="${base}engineering/upload.html">Upload Schematics</a>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  return shell({
    base,
    title: s.name.replace(/^['']|['']$/g, ''),
    desc: s.summary,
    main,
    pageId: 'solution',
  });
}

function categoryPage(cat, items, base) {
  const grid = items.map((p) => productCard(p, base)).join('\n');
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
function buildHomepage() {
  const quantum = catalog.solutions.filter((s) => s.solutionGroup === 'quantum-setups');
  const slides = quantum.slice(0, 5);
  const slideHtml = slides
    .map((s, i) => {
      const img = s.image
        ? `${s.image}`
        : 'assets/slides/01-translation-stage.png';
      const title = s.name.replace(/^['']|['']$/g, '');
      return `<div class="carousel-slide${i === 0 ? ' is-active' : ''}" data-title="${esc(title)}" data-spec="${esc(s.specHighlight)}">
        <img src="${esc(img)}" alt="${esc(title)}" />
      </div>`;
    })
    .join('\n');
  const thumbs = slides
    .map(
      (s, i) =>
        `<button type="button" class="carousel-thumb${i === 0 ? ' is-active' : ''}" data-index="${i}"><img src="${esc(s.image || 'assets/slides/01-translation-stage.png')}" alt="" /></button>`
    )
    .join('\n');
  const strip = catalog.solutions
    .map((s) => {
      const title = s.name.replace(/^['']|['']$/g, '').slice(0, 28);
      return `<a class="hardware-card" href="solutions/${s.id}.html"><img src="${esc(s.image || 'assets/slides/01-translation-stage.png')}" alt="" /><figcaption><strong>${esc(title)}</strong><span>${esc(s.sku)}</span></figcaption></a>`;
    })
    .join('\n');

  const main = `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="overline">Quantum Optics Infrastructure</div>
        <h1>Integrated Quantum Systems for Research, Education, and Advanced Photonics.</h1>
        <p>SciEngTech engineers entangled photon sources, quantum demonstration set-ups, and training kits — supported by a full bench-component catalog for optical assembly.</p>
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
        </div>
        <div class="carousel-meta">
          <span class="slide-title" id="carouselTitle">${esc(slides[0]?.name.replace(/^['']|['']$/g, '') || '')}</span>
          <span class="slide-spec" id="carouselSpec">${esc(slides[0]?.specHighlight || '')}</span>
        </div>
        <div class="carousel-thumbs" id="carouselThumbs">${thumbs}</div>
      </div>
    </div>
  </section>
  <section class="hardware-strip" aria-label="Quantum solutions">
    <div class="wrap">
      <h2>Quantum set-ups &amp; training kits</h2>
      <a class="strip-link" href="solutions.html">View all solutions →</a>
    </div>
    <div class="hardware-strip-wrap">
      <button type="button" class="strip-scroll-btn prev" id="stripPrev" aria-label="Scroll left">‹</button>
      <button type="button" class="strip-scroll-btn next" id="stripNext" aria-label="Scroll right">›</button>
      <div class="hardware-scroll" id="hardwareScroll">${strip}</div>
    </div>
  </section>
  <section class="proof">
    <div class="wrap">
      <p class="proof-label">Powering quantum optics education and research across India's leading academic and R&amp;D laboratories.</p>
      <div class="logos"><div>IIT / IISc</div><div>QUANTUM LAB</div><div>PHOTONICS R&amp;D</div><div>DRDO PROGRAM</div></div>
    </div>
  </section>
  <section class="pillars">
    <div class="wrap">
      <div class="section-head"><h2>Engineered for quantum demonstration. Specified for the lab bench.</h2></div>
      <div class="pillar-grid">
        <article class="pillar">
          <div class="pillar-num">01.</div>
          <h3>QUANTUM SET-UPS</h3>
          <p>Entangled photon sources, QKD, quantum eraser, bomb tester, and interferometry systems — turnkey for classroom and research.</p>
          <a href="solutions/quantum-setups.html">View quantum systems →</a>
        </article>
        <article class="pillar">
          <div class="pillar-num">02.</div>
          <h3>TRAINING &amp; EDUCATION KITS</h3>
          <p>Fourier optics, polarized 3D cinema, and custom delay-line kits for hands-on photonics education.</p>
          <a href="solutions/training-kits.html">View training kits →</a>
        </article>
        <article class="pillar">
          <div class="pillar-num">03.</div>
          <h3>BENCH COMPONENTS</h3>
          <p>Opto-mechanics, motion stages, optics, lasers, and hardware — the supporting catalog for quantum bench assembly.</p>
          <a href="components.html">Browse components →</a>
        </article>
      </div>
    </div>
  </section>
  <section class="data-proof">
    <div class="wrap data-inner">
      <div>
        <h2>Rigorous compliance. Guaranteed field performance.</h2>
        <div class="metric">100% Quality Inspected</div>
        <p>Every system and component undergoes validation before dispatch. Made in India — specified for institutional procurement.</p>
      </div>
      <div class="spec-table">
        <header>INSPECTION RECORD — SAMPLE</header>
        <div class="spec-row"><span>Product line</span><span>Quantum Set-Ups</span></div>
        <div class="spec-row"><span>Origin</span><span>Made in India</span></div>
        <div class="spec-row"><span>Procurement</span><span>RFQ / Quote</span></div>
        <div class="spec-row"><span>Status</span><span>PASS</span></div>
      </div>
    </div>
  </section>
  <section class="cta-band">
    <div class="wrap">
      <h2>Ready to configure your quantum lab requirements?</h2>
      <p>Upload engineering schematics or request a technical quote for quantum systems and bench components.</p>
      <p class="file-types">.dxf · .step · .pdf</p>
      <div class="hero-ctas">
        <a class="btn btn-ruby" href="engineering/upload.html">Upload Tech Specs &amp; Connect</a>
        <a class="btn btn-outline" href="company/contact.html">Contact System Engineer</a>
      </div>
    </div>
  </section>
  <script src="js/home-carousel.js"></script>`;

  write(
    'index.html',
    shell({
      base: '',
      title: 'Quantum Optics Systems & Photonics Hardware',
      desc: 'Integrated quantum set-ups, training kits, and bench components for research and education. Request a technical quote.',
      main,
      pageId: 'home',
    })
  );
}

function buildSolutionsHub(base, rel) {
  const q = catalog.solutions.filter((s) => s.solutionGroup === 'quantum-setups');
  const t = catalog.solutions.filter((s) => s.solutionGroup === 'training-kits');
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>Quantum &amp; Photonics Solutions</h1>
      <p>Turnkey quantum demonstration systems and educational kits — specified, validated, and supported by SciEngTech engineering.</p>
      <h2 class="hub-section-title">Quantum Set-Ups</h2>
      <div class="product-grid">${q.map((p) => productCard(p, base)).join('')}</div>
      <h2 class="hub-section-title" style="margin-top:48px">Training &amp; Education Kits</h2>
      <div class="product-grid">${t.map((p) => productCard(p, base)).join('')}</div>
    </div>
  </section>`;
  write(rel, shell({ base, title: 'Solutions', desc: 'Quantum set-ups and training kits.', main, pageId: 'solutions' }));
}

function buildSubHub(base, rel, title, desc, group) {
  const items = catalog.solutions.filter((s) => s.solutionGroup === group);
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <nav class="product-breadcrumb"><a href="${base}index.html">Home</a> / <a href="${base}solutions.html">Solutions</a> / <span>${esc(title)}</span></nav>
      <h1>${esc(title)}</h1>
      <p>${esc(desc)}</p>
      <div class="product-grid">${items.map((p) => productCard(p, base)).join('')}</div>
    </div>
  </section>`;
  write(rel, shell({ base, title, desc, main }));
}

function buildComponentsHub(base, rel) {
  const cards = CATEGORIES.map((cat) => {
    const count = catalog.components.filter((c) => c.category === cat.slug).length;
    return `<a class="pillar" href="${base}components/${cat.slug}.html" style="text-decoration:none;color:inherit">
      <div class="pillar-num">${String(count).padStart(2, '0')}</div>
      <h3>${esc(cat.label.toUpperCase())}</h3>
      <p>${count} spec-verified component${count === 1 ? '' : 's'}.</p>
      <span style="color:var(--accent);font-size:0.875rem;font-weight:600">View category →</span>
    </a>`;
  }).join('');
  const main = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>Technical Component Catalog</h1>
      <p>Bench hardware supporting quantum and photonics assembly — ${catalog.components.length} components across six engineering categories.</p>
      <div class="pillar-grid" style="margin-top:32px">${cards}</div>
    </div>
  </section>`;
  write(rel, shell({ base, title: 'Components', desc: 'Quantum bench component catalog.', main, pageId: 'components' }));
}

function buildCompanyPage(base, rel, title, content) {
  write(rel, shell({ base, title, desc: title, main: content }));
}

function main() {
  console.log('Building site pages...');
  buildHomepage();

  buildSolutionsHub('', 'solutions.html');
  buildSubHub('', 'solutions/quantum-setups.html', 'Quantum Set-Ups', 'Integrated quantum demonstration and research systems.', 'quantum-setups');
  buildSubHub('', 'solutions/training-kits.html', 'Training & Education Kits', 'Hands-on photonics and quantum education kits.', 'training-kits');

  for (const s of catalog.solutions) {
    write(`solutions/${s.id}.html`, solutionDetailPage(s, '../'));
  }

  buildComponentsHub('', 'components.html');
  for (const cat of CATEGORIES) {
    const items = catalog.components.filter((c) => c.category === cat.slug);
    write(`components/${cat.slug}.html`, categoryPage(cat, items, '../'));
  }

  // components catalog with search
  const compMain = `<section class="catalog-page">
    <div class="wrap catalog-hero">
      <h1>Search Components</h1>
      <p>Filter and search ${catalog.components.length} bench components.</p>
      <div class="catalog-toolbar">
        <input type="search" class="catalog-search-input" id="catalogSearchInput" placeholder="Search components, specifications…" autocomplete="off" />
        <div class="catalog-filters" id="catalogFilters"></div>
      </div>
      <p class="catalog-meta" id="catalogCount">Loading…</p>
      <div class="product-grid" id="productGrid"></div>
    </div>
  </section>`;
  const compPage = shell({ base: '../', title: 'Component Search', desc: 'Search catalog', main: compMain, pageId: 'catalog-search' });
  const compWithScript = compPage.replace('</body>', '  <script src="../js/products-page.js"></script>\n</body>');
  write('components/search.html', compWithScript);

  // product.html template page
  const prodMain = `<section class="product-detail" id="productMain"><div class="wrap"><p class="catalog-meta">Loading…</p></div></section>`;
  const prodPage = shell({ base: '', title: 'Component Spec', desc: 'Component specification', main: prodMain });
  write('product.html', prodPage.replace('</body>', '  <script src="js/product-page.js"></script>\n</body>'));

  // Company & engineering
  buildCompanyPage('../', 'company/about.html', 'About Us', `<section class="page-content"><div class="wrap">
    <h1>About SciEngTech</h1>
    <p class="lead">Sci.Eng.Tech Solutions engineers quantum optics systems, educational photonics kits, and precision bench hardware for India's research and academic institutions.</p>
    <div class="pillar-grid" style="margin-top:40px">
      <article class="pillar"><div class="pillar-num">01.</div><h3>QUANTUM SYSTEMS</h3><p>Turnkey entangled photon sources, QKD platforms, and quantum demonstration experiments.</p></article>
      <article class="pillar"><div class="pillar-num">02.</div><h3>MANUFACTURING</h3><p>Made in India — opto-mechanical assemblies, optical components, and integrated kits.</p></article>
      <article class="pillar"><div class="pillar-num">03.</div><h3>QUALITY</h3><p>100% quality inspected. Every system specified for institutional procurement via RFQ.</p></article>
    </div>
  </div></section>`);

  buildCompanyPage('../', 'company/contact.html', 'Contact', `<section class="page-content"><div class="wrap">
    <h1>Contact &amp; Credentials</h1>
    <div class="contact-grid">
      <div><h3>Pune Headquarters</h3><p>14, Om Shanti, 156/2 Mangalwar Peth<br>Pune – 411 011, India</p><p><a href="mailto:info@sciengtech.in">info@sciengtech.in</a></p></div>
      <div><h3>Credentials</h3><p>GST: [Client to provide]</p><p>GeM Vendor ID: [Client to provide]</p></div>
      <div><h3>Engineering</h3><p><a href="../engineering/rfq.html">Request Technical Quote</a></p><p><a href="../engineering/upload.html">Upload Schematics</a></p></div>
    </div>
  </div></section>`);

  buildCompanyPage('../', 'engineering/rfq.html', 'Request Technical Quote', `<section class="page-content"><div class="wrap">
    <h1>Request Technical Quote</h1>
    <p class="lead">Submit your BOM, quantities, and application notes. Our engineering team will respond with specifications and lead times.</p>
    <div class="form-placeholder"><p>Embed your Google Form URL here. All site CTAs link to this page.</p><a class="btn btn-ruby" href="mailto:info@sciengtech.in?subject=Technical%20Quote%20Request">Email Engineering Team</a></div>
  </div></section>`);

  buildCompanyPage('../', 'engineering/upload.html', 'Upload Schematics', `<section class="page-content"><div class="wrap">
    <h1>Upload Schematics</h1>
    <p class="lead">Submit .dxf, .step, or .pdf drawings for custom component verification.</p>
    <p class="file-types">.dxf · .step · .pdf</p>
    <div class="form-placeholder"><a class="btn btn-ruby" href="mailto:info@sciengtech.in?subject=Schematic%20Upload">Email Drawings to Engineering</a></div>
  </div></section>`);

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

  // Redirect old products.html
  write('products.html', `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=components.html" /><title>Redirect</title></head><body><p><a href="components.html">Components catalog</a></p></body></html>`);

  console.log('Done.');
}

main();
