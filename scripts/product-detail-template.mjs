/**
 * HTML rendering for product detail pages (4 templates).
 * Used by build-site.mjs (Node) and product-page.js (browser via product-detail-render.js).
 */
import { solutionGroupLabel, solutionGroupHubUrl } from './solution-groups.mjs';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanName(name) {
  return String(name || '').replace(/^[\u2018\u2019'']+|[\u2018\u2019'']+$/g, '').trim();
}

function productImages(p) {
  if (p.images?.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

function renderMedia(p, base) {
  const images = productImages(p);
  const name = esc(cleanName(p.name));
  if (!images.length) {
    return '<span class="placeholder" aria-hidden="true">◇</span>';
  }

  const mainSrc = p.image || images[0];
  const stage = `<div class="product-media-stage">
    <img src="${base}${esc(mainSrc)}" alt="${name}" data-gallery-main />
  </div>`;

  if (images.length === 1) {
    return `<div class="product-media-gallery" data-product-gallery>${stage}</div>`;
  }

  const thumbs = images
    .map((src, i) => {
      const active = src === mainSrc ? ' is-active' : '';
      return `<button type="button" class="product-media-thumb${active}" data-gallery-src="${base}${esc(src)}" aria-label="View image ${i + 1}">
        <img src="${base}${esc(src)}" alt="" loading="lazy" />
      </button>`;
    })
    .join('');

  return `<div class="product-media-gallery" data-product-gallery>
    ${stage}
    <div class="product-media-thumbs" role="list">${thumbs}</div>
  </div>`;
}

function renderAddToCartBtn(p, opts = {}) {
  const sku = opts.sku != null ? opts.sku : p.sku || '';
  const name = cleanName(p.name);
  const variantLabel = opts.variantLabel || '';
  return `<button type="button" class="btn btn-ruby" data-add-to-cart
    data-product-id="${esc(p.id)}"
    data-sku="${esc(sku)}"
    data-name="${esc(name)}"
    ${variantLabel ? `data-variant-label="${esc(variantLabel)}"` : ''}>Add to Cart</button>`;
}

function renderCtas(p, base, extraQuery = '') {
  return `<div class="product-ctas">
    ${renderAddToCartBtn(p)}
    <a class="btn btn-outline" href="${base}engineering/rfq.html">Checkout</a>
  </div>`;
}

function renderBulletList(items, className = 'product-bullet-list') {
  if (!items?.length) return '';
  return `<ul class="${className}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function renderTwoColBlocks(leftTitle, leftItems, rightTitle, rightItems) {
  if (!leftItems?.length && !rightItems?.length) return '';
  return `<div class="product-detail-blocks">
    ${leftItems?.length ? `<div class="product-detail-block"><h2 class="product-section-title">${esc(leftTitle)}</h2>${renderBulletList(leftItems)}</div>` : ''}
    ${rightItems?.length ? `<div class="product-detail-block"><h2 class="product-section-title">${esc(rightTitle)}</h2>${renderBulletList(rightItems)}</div>` : ''}
  </div>`;
}

function renderSpecTable(header, rows) {
  if (!rows?.length) return '';
  const body = rows
    .map(
      (r) =>
        `<div class="spec-row"><span>${esc(r.label)}</span><span>${esc(r.value)}</span></div>`
    )
    .join('');
  return `<div class="spec-table-detail"><header>${esc(header)}</header>${body}</div>`;
}

function renderOverview(p) {
  const paras = p.overview?.length ? p.overview : p.summary ? [p.summary] : [];
  if (!paras.length) return '';
  return `<div class="product-summary">${paras.map((para) => `<p>${esc(para)}</p>`).join('')}</div>`;
}

function variantColumns(variants) {
  if (!variants.length) return [];
  const skip = new Set(['sr', 'sku']);
  const keys = Object.keys(variants[0]).filter((k) => !skip.has(k));
  return keys.map((k) => ({
    key: k,
    label: k
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

function renderVariantTable(p, base) {
  if (!p.variants?.length) return '';
  const cols = variantColumns(p.variants);
  const head = `<thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th>SKU</th><th></th></tr></thead>`;
  const body = p.variants
    .map((row) => {
      const sku = row.sku || row.product_code || row.set_code || '';
      const skuClean = String(sku).replace(/\s+/g, '');
      const variantLabel = cols
        .map((c) => row[c.key] || '')
        .filter(Boolean)
        .join(' · ');
      return `<tr>
        <td>${esc(row.sr)}</td>
        ${cols.map((c) => `<td>${esc(row[c.key] || '')}</td>`).join('')}
        <td class="mono">${esc(skuClean)}</td>
        <td><button type="button" class="variant-cart-btn" data-add-to-cart
          data-product-id="${esc(p.id)}"
          data-sku="${esc(skuClean)}"
          data-name="${esc(cleanName(p.name))}"
          data-variant-label="${esc(variantLabel)}">Add</button></td>
      </tr>`;
    })
    .join('');
  const note = p.customNote
    ? `<p class="product-variant-note">${esc(p.customNote)}</p>`
    : '';
  return `<div class="product-variant-section">
    <h2 class="product-section-title">Available Configurations</h2>
    <div class="product-variant-table-wrap">
      <table class="product-variant-table">${head}<tbody>${body}</tbody></table>
    </div>
    ${note}
  </div>`;
}

function renderConfigurationOptions(p) {
  const opts = p.configurationOptions;
  if (!opts || !Object.keys(opts).length) return '';
  const chips = Object.entries(opts)
    .map(([key, values]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `<div class="config-option-group">
        <span class="config-option-label">${esc(label)}</span>
        <div class="config-option-values">${values.map((v) => `<span class="config-chip">${esc(v)}</span>`).join('')}</div>
      </div>`;
    })
    .join('');
  return `<div class="product-config-section">
    <h2 class="product-section-title">Configuration Options</h2>
    <p class="product-config-hint">Select combinations when requesting a quote — pricing varies by configuration.</p>
    ${chips}
  </div>`;
}

function renderRfqParameters(p) {
  if (!p.rfqSections?.length) return '';
  const tabs = p.rfqSections
    .map(
      (s, i) =>
        `<button type="button" class="rfq-tab${i === 0 ? ' is-active' : ''}" data-rfq-tab="${esc(s.id)}">${esc(s.title)}</button>`
    )
    .join('');
  const panels = p.rfqSections
    .map(
      (s, i) =>
        `<div class="rfq-panel${i === 0 ? ' is-active' : ''}" data-rfq-panel="${esc(s.id)}">
          <p class="rfq-panel-intro">Share the following parameters for ${esc(s.title.toLowerCase())} when requesting a quote:</p>
          <ul class="product-bullet-list rfq-param-list">${s.parameters.map((param) => `<li>${esc(param)}</li>`).join('')}</ul>
        </div>`
    )
    .join('');
  return `<div class="product-rfq-section" data-rfq-tabs>
    <h2 class="product-section-title">Specify Your Requirements</h2>
    <div class="rfq-tabs" role="tablist">${tabs}</div>
    ${panels}
  </div>`;
}

function renderHeroMeta(p, overline) {
  const name = cleanName(p.name);
  const aliases =
    p.aliases?.length ?
      `<p class="product-aliases">${esc(p.aliases.join(' · '))}</p>`
    : '';
  const skuLine =
    p.pageTemplate === 'configurable' && !p.variants?.length ?
      '<p class="product-sku-line mono">Quote-driven · configure below</p>'
    : `<p class="product-sku-line mono">SKU: ${esc(p.sku)}</p>`;
  const highlight =
    p.pageTemplate === 'solution' ?
      ''
    : p.specHighlight ?
      `<p class="product-highlight mono">${esc(p.specHighlight)}</p>`
    : '';
  const tagline =
    p.solutionContent?.tagline ?
      `<p class="product-tagline">${esc(p.solutionContent.tagline)}</p>`
    : '';

  return `<p class="product-overline">${esc(overline)}</p>
    <h1>${esc(name)}</h1>
    ${aliases}
    ${skuLine}
    ${tagline}
    ${highlight}`;
}

function renderComponentBody(p, base) {
  const specs = p.techSpecs?.length ? p.techSpecs : p.keyValueSpecs?.length ? p.keyValueSpecs : null;
  const specHeader = p.keyValueSpecs?.length && !p.techSpecs?.length ? 'SPECIFICATION SHEET' : 'SPECIFICATION SHEET';

  return `${renderOverview(p)}
    ${renderTwoColBlocks('Features', p.features, 'Applications', p.applications)}
    ${specs ? renderSpecTable(specHeader, specs) : ''}
    ${renderCtas(p, base)}`;
}

function renderSolutionBody(p, base) {
  const sc = p.solutionContent || {};
  const demonstrates = sc.demonstrates?.length ? sc.demonstrates : p.features;
  const kitIncludes = sc.kitIncludes || [];
  const capabilities = sc.capabilities?.length ? sc.capabilities : [];
  const showOverview = p.overview?.length && !demonstrates?.length;

  return `${showOverview ? renderOverview(p) : ''}
    ${demonstrates?.length ? `<div class="product-solution-section"><h2 class="product-section-title">What This Kit Demonstrates</h2>${renderBulletList(demonstrates)}</div>` : ''}
    ${kitIncludes?.length ? `<div class="product-solution-section"><h2 class="product-section-title">What's Included</h2>${renderBulletList(kitIncludes)}</div>` : ''}
    ${capabilities?.length ? `<div class="product-solution-section"><h2 class="product-section-title">Key Capabilities</h2>${renderBulletList(capabilities)}</div>` : ''}
    ${renderCtas(p, base)}`;
}

function renderCustomSolutionBody(p, base) {
  const sc = p.solutionContent || {};
  const demonstrates = sc.demonstrates || [];
  const kitIncludes = sc.kitIncludes || [];
  const note = p.customNote ?
    `<p class="product-custom-note">${esc(p.customNote)}</p>`
  : '';

  return `${renderOverview(p)}
    ${note}
    ${demonstrates.length ? `<div class="product-solution-section"><h2 class="product-section-title">Overview</h2>${renderBulletList(demonstrates)}</div>` : ''}
    ${renderRfqParameters(p)}
    ${kitIncludes.length ? `<div class="product-solution-section"><h2 class="product-section-title">Engagement</h2>${renderBulletList(kitIncludes)}</div>` : ''}
    ${renderCtas(p, base)}`;
}

export function renderProductDetailMain(p, { base, breadcrumbHtml }) {
  const template = p.pageTemplate || (p.type === 'solution' ? 'solution' : 'component');
  const overline =
    p.type === 'solution' ?
      p.categoryLabel || solutionGroupLabel(p.solutionGroup)
    : p.categoryLabel || 'Component';

  let body = '';
  switch (template) {
    case 'solution':
      body = renderSolutionBody(p, base);
      break;
    case 'variant-catalog':
      body = `${renderOverview(p)}
        ${renderTwoColBlocks('Features', p.features, 'Applications', p.applications)}
        ${renderVariantTable(p, base)}
        ${p.techSpecs?.length ? renderSpecTable('TECHNICAL SPECIFICATIONS', p.techSpecs) : ''}
        ${renderCtas(p, base)}`;
      break;
    case 'configurable':
      body =
        p.type === 'solution' ?
          renderCustomSolutionBody(p, base)
        : `${renderOverview(p)}
        ${renderConfigurationOptions(p)}
        ${renderRfqParameters(p)}
        ${renderTwoColBlocks('Features', p.features, 'Applications', p.applications)}
        ${renderCtas(p, base)}`;
      break;
    default:
      body = renderComponentBody(p, base);
  }

  return `<section class="product-detail product-detail--${esc(template)}">
    <div class="wrap">
      ${breadcrumbHtml}
      <div class="product-detail-grid">
        <div class="product-detail-media">${renderMedia(p, base)}</div>
        <div class="product-detail-main">
          ${renderHeroMeta(p, overline)}
          ${body}
        </div>
      </div>
    </div>
  </section>`;
}

export function renderComponentBreadcrumb(p, base) {
  const name = cleanName(p.name);
  return `<nav class="product-breadcrumb" aria-label="Breadcrumb">
    <a href="${base}index.html">Home</a> /
    <a href="${base}components.html">Components</a> /
    <a href="${base}components/${esc(p.category)}.html">${esc(p.categoryLabel)}</a> /
    <span>${esc(name)}</span>
  </nav>`;
}

export function renderSolutionBreadcrumb(p, base) {
  const name = cleanName(p.name);
  const groupLabel = p.categoryLabel || solutionGroupLabel(p.solutionGroup);
  const groupUrl = solutionGroupHubUrl(p.solutionGroup, base);
  return `<nav class="product-breadcrumb" aria-label="Breadcrumb">
    <a href="${base}index.html">Home</a> /
    <a href="${base}solutions.html">Solutions</a> /
    <a href="${groupUrl}">${esc(groupLabel)}</a> /
    <span>${esc(name)}</span>
  </nav>`;
}

export function renderProductDetail(p, { base = '' } = {}) {
  const breadcrumb =
    p.type === 'solution' ?
      renderSolutionBreadcrumb(p, base)
    : renderComponentBreadcrumb(p, base);
  return renderProductDetailMain(p, { base, breadcrumbHtml: breadcrumb });
}

export function initProductDetailInteractions(root) {
  if (!root) return;
  root.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
    const main = gallery.querySelector('[data-gallery-main]');
    if (!main) return;
    gallery.querySelectorAll('.product-media-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('data-gallery-src');
        if (!src) return;
        main.src = src;
        gallery.querySelectorAll('.product-media-thumb').forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  });
  root.querySelectorAll('[data-rfq-tabs]').forEach((wrap) => {
    wrap.querySelectorAll('.rfq-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-rfq-tab');
        wrap.querySelectorAll('.rfq-tab').forEach((t) => t.classList.remove('is-active'));
        wrap.querySelectorAll('.rfq-panel').forEach((p) => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        wrap.querySelector(`[data-rfq-panel="${id}"]`)?.classList.add('is-active');
      });
    });
  });
}
