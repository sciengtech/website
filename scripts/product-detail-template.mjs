/**
 * HTML rendering for product detail pages (5 templates).
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

function normText(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.·]+$/g, '');
}

function isDuplicateText(a, b) {
  const na = normText(a);
  const nb = normText(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function uniqueTexts(items, ...skip) {
  const skipNorm = skip.map(normText).filter(Boolean);
  const kept = [];
  return (items || []).filter((item) => {
    const n = normText(item);
    if (!n) return false;
    if (skipNorm.some((s) => isDuplicateText(s, item))) return false;
    if (kept.some((k) => isDuplicateText(k, item))) return false;
    kept.push(item);
    return true;
  });
}

function productImages(p) {
  if (p.images?.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

function variantsWithImages(p) {
  if (!p.variants?.length) return [];
  return p.variants.filter((v) => v.image);
}

function variantLabelForRow(row) {
  const cols = variantColumns([row]);
  return cols
    .map((c) => row[c.key] || '')
    .filter(Boolean)
    .join(' · ');
}

function variantForImagePath(p, src) {
  const variants = variantsWithImages(p);
  for (let i = 0; i < variants.length; i++) {
    if (variants[i].image === src) return variants[i];
  }
  return null;
}

function renderVariantPicker(p, base) {
  const variants = variantsWithImages(p);
  if (!variants.length) return '';
  const chips = variants
    .map((row, i) => {
      const sku = String(row.sku || row.product_code || row.set_code || '').replace(/\s+/g, '');
      const cols = variantColumns([row]);
      const label = cols
        .map((c) => row[c.key] || '')
        .filter(Boolean)
        .join(' · ');
      const chipLabel = label ? `${sku} · ${label}` : sku;
      return `<button type="button" class="variant-picker-chip${i === 0 ? ' is-active' : ''}"
        data-variant-sku="${esc(sku)}"
        data-variant-image="${base}${esc(row.image)}"
        data-variant-label="${esc(label)}"
        aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(chipLabel)}</button>`;
    })
    .join('');
  return `<div class="product-variant-picker" data-variant-picker role="list">${chips}</div>`;
}

function renderMedia(p, base) {
  const images = productImages(p);
  const name = esc(cleanName(p.name));
  if (!images.length) {
    return '<span class="placeholder" aria-hidden="true">◇</span>';
  }

  const imageVariants = variantsWithImages(p);
  const mainSrc =
    imageVariants.length ? imageVariants[0].image : p.image || images[0];
  const stage = `<button type="button" class="product-media-stage" data-gallery-open aria-label="View ${name} fullscreen">
    <img src="${base}${esc(mainSrc)}" alt="${name}" data-gallery-main />
  </button>`;

  const picker = renderVariantPicker(p, base);
  const galleryAttrs =
    ` data-product-gallery data-default-sku="${esc(p.sku || '')}"`;
  if (images.length === 1) {
    return `<div class="product-media-gallery"${galleryAttrs}>${stage}${picker}</div>`;
  }

  const thumbs = images
    .map((src, i) => {
      const active = src === mainSrc ? ' is-active' : '';
      const variant = variantForImagePath(p, src);
      const variantSku = variant
        ? String(variant.sku || variant.product_code || variant.set_code || '').replace(/\s+/g, '')
        : '';
      const variantLabel = variant ? variantLabelForRow(variant) : '';
      const variantAttrs = variant
        ? ` data-variant-sku="${esc(variantSku)}" data-variant-label="${esc(variantLabel)}"`
        : '';
      return `<button type="button" class="product-media-thumb${active}" data-gallery-src="${base}${esc(src)}"${variantAttrs} aria-label="View image ${i + 1}">
        <img src="${base}${esc(src)}" alt="" loading="lazy" />
      </button>`;
    })
    .join('');

  return `<div class="product-media-gallery"${galleryAttrs}>
    ${stage}
    <div class="product-media-thumbs" role="list">${thumbs}</div>
    ${picker}
  </div>`;
}

function renderAddToCartBtn(p, opts = {}) {
  const sku = opts.sku != null ? opts.sku : p.sku || '';
  const name = cleanName(p.name);
  const variantLabel = opts.variantLabel || '';
  return `<button type="button" class="btn btn-ruby" data-add-to-cart data-product-cart-btn
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
  const skip = new Set(['sr', 'sku', 'image']);
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
  const head = `<thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th>Product Code</th><th></th></tr></thead>`;
  const body = p.variants
    .map((row) => {
      const sku = row.sku || row.product_code || row.set_code || '';
      const skuClean = String(sku).replace(/\s+/g, '');
      const variantLabel = cols
        .map((c) => row[c.key] || '')
        .filter(Boolean)
        .join(' · ');
      const rowAttrs = row.image
        ? ` class="variant-row-selectable" data-variant-row data-variant-sku="${esc(skuClean)}" data-variant-image="${base}${esc(row.image)}" data-variant-label="${esc(variantLabel)}"`
        : '';
      return `<tr${rowAttrs}>
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
  const hints = p.rfqSections
    .flatMap((s) => s.parameters || [])
    .filter(Boolean)
    .slice(0, 8);
  const hintList = hints.length
    ? `<ul class="product-bullet-list rfq-param-list" data-requirements-hints>${hints.map((param) => `<li>${esc(param)}</li>`).join('')}</ul>`
    : '';
  return `<div class="product-rfq-section" data-requirements-box>
    <button type="button" class="btn btn-outline" data-requirements-toggle>Specify Your Requirements</button>
    <div class="requirements-panel" data-requirements-panel hidden>
      <p class="rfq-panel-intro">Describe the configuration, wavelengths, quantities, or other details you need. This note is added to your quote cart.</p>
      ${hintList}
      <label class="sr-only" for="requirements-text-${esc(p.id)}">Requirements</label>
      <textarea id="requirements-text-${esc(p.id)}" class="requirements-textarea" data-requirements-text rows="5" placeholder="e.g. wavelength, pulse width, mounting constraints…"></textarea>
      <button type="button" class="btn btn-ruby" data-requirements-add
        data-product-id="${esc(p.id)}"
        data-sku="${esc(p.sku || '')}"
        data-name="${esc(cleanName(p.name))}">Add requirements to quote</button>
      <p class="requirements-status" data-requirements-status hidden></p>
    </div>
  </div>`;
}

function renderHeroMeta(p, overline) {
  const name = cleanName(p.name);
  const aliases =
    p.aliases?.length ?
      `<p class="product-aliases">${esc(p.aliases.join(' · '))}</p>`
    : '';
  const imageVariants = variantsWithImages(p);
  const defaultSku =
    imageVariants.length ?
      String(imageVariants[0].sku || imageVariants[0].product_code || '').replace(/\s+/g, '')
    : p.sku;
  const skuLine =
    p.pageTemplate === 'variant-catalog' ?
      ''
    : p.pageTemplate === 'configurable' && !p.variants?.length ?
      '<p class="product-sku-line mono">Quote-driven · configure below</p>'
    : `<p class="product-sku-line mono" data-product-sku-line>Product Code: ${esc(defaultSku)}</p>`;
  const highlight =
    p.pageTemplate === 'solution' ||
    (p.pageTemplate === 'configurable' && p.solutionContent?.tagline) ?
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

function renderSpecSections(p) {
  if (!p.specSections?.length) return '';
  const tabs = p.specSections
    .map(
      (s, i) =>
        `<button type="button" class="rfq-tab${i === 0 ? ' is-active' : ''}" data-rfq-tab="${esc(s.id)}" role="tab">${esc(s.title)}</button>`
    )
    .join('');
  const panels = p.specSections
    .map((s, i) => {
      const table = renderSpecTable('Key Features', s.specs || []);
      return `<div class="rfq-panel${i === 0 ? ' is-active' : ''}" data-rfq-panel="${esc(s.id)}">${table}</div>`;
    })
    .join('');
  return `<div class="product-rfq-section product-spec-tabs" data-rfq-tabs>
    <div class="rfq-tabs" role="tablist">${tabs}</div>
    ${panels}
  </div>`;
}

function renderComponentBody(p, base) {
  const specs =
    p.techSpecs?.length ? p.techSpecs
    : !p.specSections?.length && p.keyValueSpecs?.length ? p.keyValueSpecs
    : null;
  const specHeader = p.keyValueSpecs?.length && !p.techSpecs?.length ? 'SPECIFICATION SHEET' : 'SPECIFICATION SHEET';
  const note =
    p.customNote ?
      `<p class="product-custom-note">${esc(p.customNote)}</p>`
    : '';

  return `${renderOverview(p)}
    ${renderTwoColBlocks('Features', p.features, 'Applications', p.applications)}
    ${specs ? renderSpecTable(specHeader, specs) : ''}
    ${renderSpecSections(p)}
    ${note}
    ${renderCtas(p, base)}`;
}

function renderSolutionBody(p, base) {
  const sc = p.solutionContent || {};
  const tagline = sc.tagline || '';
  const demonstrates = uniqueTexts(
    sc.demonstrates?.length ? sc.demonstrates : p.features,
    tagline
  );
  const kitIncludes = sc.kitIncludes || [];
  const capabilities = uniqueTexts(sc.capabilities?.length ? sc.capabilities : [], tagline, ...demonstrates);
  const showOverview = p.overview?.length && !demonstrates?.length;

  return `${showOverview ? renderOverview(p) : ''}
    ${demonstrates?.length ? `<div class="product-solution-section"><h2 class="product-section-title">What This Kit Demonstrates</h2>${renderBulletList(demonstrates)}</div>` : ''}
    ${kitIncludes?.length ? `<div class="product-solution-section"><h2 class="product-section-title">What's Included</h2>${renderBulletList(kitIncludes)}</div>` : ''}
    ${capabilities?.length ? `<div class="product-solution-section"><h2 class="product-section-title">Key Capabilities</h2>${renderBulletList(capabilities)}</div>` : ''}
    ${renderCtas(p, base)}`;
}

function renderCustomSolutionBody(p, base) {
  const sc = p.solutionContent || {};
  const tagline = sc.tagline || '';
  const overviewParas = uniqueTexts(p.overview, tagline);
  const demonstrates = uniqueTexts(sc.demonstrates, tagline, ...overviewParas, p.customNote);
  const showCustomNote =
    p.customNote &&
    !isDuplicateText(p.customNote, tagline) &&
    !overviewParas.some((para) => isDuplicateText(para, p.customNote));
  const note = showCustomNote ?
    `<p class="product-custom-note">${esc(p.customNote)}</p>`
  : '';

  return `${overviewParas.length ? renderOverview({ ...p, overview: overviewParas }) : ''}
    ${note}
    ${demonstrates.length ? `<div class="product-solution-section"><h2 class="product-section-title">Overview</h2>${renderBulletList(demonstrates)}</div>` : ''}
    ${renderRfqParameters(p)}
    ${renderCtas(p, base)}`;
}

function renderHtmlBody(p, base) {
  const html = String(p.htmlBody || '').trim();
  const content = html ?
    `<div class="product-html-body knowledge-prose">${html}</div>`
  : '<p class="product-empty-note">Product details coming soon.</p>';
  return `${content}${renderCtas(p, base)}`;
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
    case 'rich-page':
      body = renderHtmlBody(p, base);
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
  const categoryHref = p.categoryPath
    ? `${base}${String(p.categoryPath).replace(/^\//, '')}`
    : `${base}components/${esc(p.category)}.html`;
  return `<nav class="product-breadcrumb" aria-label="Breadcrumb">
    <a href="${base}index.html">Home</a> /
    <a href="${base}components.html">Categories</a> /
    <a href="${categoryHref}">${esc(p.categoryLabel)}</a> /
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

  function initProductLightbox(rootEl) {
    let lightbox = document.getElementById('productLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'productLightbox';
      lightbox.className = 'product-lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Product image viewer');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.innerHTML = `<button type="button" class="product-lightbox__backdrop" data-lightbox-close aria-label="Close image viewer"></button>
        <button type="button" class="product-lightbox__close" data-lightbox-close aria-label="Close">&times;</button>
        <button type="button" class="product-lightbox__nav product-lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">&#8249;</button>
        <button type="button" class="product-lightbox__nav product-lightbox__nav--next" data-lightbox-next aria-label="Next image">&#8250;</button>
        <div class="product-lightbox__panel">
          <div class="product-lightbox__stage"><img src="" alt="" data-lightbox-img /></div>
          <p class="product-lightbox__counter" data-lightbox-counter hidden></p>
        </div>`;
      document.body.appendChild(lightbox);
    }

    const state = { sources: [], index: 0, alt: '' };
    const img = lightbox.querySelector('[data-lightbox-img]');
    const counter = lightbox.querySelector('[data-lightbox-counter]');
    const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
    const nextBtn = lightbox.querySelector('[data-lightbox-next]');

    const gallerySources = (gallery) => {
      const thumbs = gallery.querySelectorAll('.product-media-thumb[data-gallery-src]');
      if (thumbs.length) {
        return [...thumbs].map((thumb) => thumb.getAttribute('data-gallery-src') || '').filter(Boolean);
      }
      const main = gallery.querySelector('[data-gallery-main]');
      return main?.src ? [main.src] : [];
    };

    const currentIndex = (sources, main) => {
      if (!main || !sources.length) return 0;
      const src = main.getAttribute('src') || main.src;
      const idx = sources.indexOf(src);
      return idx >= 0 ? idx : 0;
    };

    const updateLightbox = () => {
      if (!img || !state.sources.length) return;
      img.src = state.sources[state.index];
      img.alt = state.alt;
      if (counter) {
        if (state.sources.length > 1) {
          counter.hidden = false;
          counter.textContent = `${state.index + 1} / ${state.sources.length}`;
        } else {
          counter.hidden = true;
          counter.textContent = '';
        }
      }
      if (prevBtn) prevBtn.disabled = state.index <= 0;
      if (nextBtn) nextBtn.disabled = state.index >= state.sources.length - 1;
    };

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('product-lightbox-open');
    };

    const openLightbox = (sources, index, alt) => {
      if (!sources.length) return;
      state.sources = sources;
      state.index = index;
      state.alt = alt || '';
      updateLightbox();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('product-lightbox-open');
      lightbox.querySelector('.product-lightbox__close')?.focus();
    };

    if (!lightbox.dataset.bound) {
      lightbox.dataset.bound = 'true';
      lightbox.querySelectorAll('[data-lightbox-close]').forEach((btn) => {
        btn.addEventListener('click', closeLightbox);
      });
      prevBtn?.addEventListener('click', () => {
        if (state.index > 0) {
          state.index -= 1;
          updateLightbox();
        }
      });
      nextBtn?.addEventListener('click', () => {
        if (state.index < state.sources.length - 1) {
          state.index += 1;
          updateLightbox();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          closeLightbox();
        } else if (e.key === 'ArrowLeft' && state.index > 0) {
          e.preventDefault();
          state.index -= 1;
          updateLightbox();
        } else if (e.key === 'ArrowRight' && state.index < state.sources.length - 1) {
          e.preventDefault();
          state.index += 1;
          updateLightbox();
        }
      });
    }

    rootEl.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
      const stage = gallery.querySelector('[data-gallery-open], .product-media-stage');
      if (!stage || stage.dataset.lightboxBound) return;
      stage.dataset.lightboxBound = 'true';
      stage.addEventListener('click', () => {
        const main = gallery.querySelector('[data-gallery-main]');
        const sources = gallerySources(gallery);
        if (!sources.length) return;
        openLightbox(sources, currentIndex(sources, main), main?.alt || '');
      });
    });
  }

  function applyVariantSelection(sku, imageSrc, label) {
    const gallery = root.querySelector('[data-product-gallery]');
    const main = gallery?.querySelector('[data-gallery-main]');
    if (main && imageSrc) {
      main.src = imageSrc;
      gallery?.querySelectorAll('.product-media-thumb').forEach((thumb) => {
        const thumbSrc = thumb.getAttribute('data-gallery-src') || '';
        thumb.classList.toggle('is-active', thumbSrc === imageSrc);
      });
    }
    const defaultSku = gallery?.getAttribute('data-default-sku') || '';
    const activeSku = sku || defaultSku;
    const skuLine = root.querySelector('[data-product-sku-line]');
    if (skuLine && activeSku) skuLine.textContent = `Product Code: ${activeSku}`;
    root.querySelectorAll('[data-product-cart-btn]').forEach((btn) => {
      if (activeSku) btn.setAttribute('data-sku', activeSku);
      if (sku && label) btn.setAttribute('data-variant-label', label);
      else btn.removeAttribute('data-variant-label');
    });
    root.querySelectorAll('.variant-picker-chip').forEach((chip) => {
      const active = Boolean(sku) && chip.getAttribute('data-variant-sku') === sku;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    root.querySelectorAll('[data-variant-row]').forEach((row) => {
      row.classList.toggle('is-selected', Boolean(sku) && row.getAttribute('data-variant-sku') === sku);
    });
  }

  root.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
    const main = gallery.querySelector('[data-gallery-main]');
    if (!main) return;
    gallery.querySelectorAll('.product-media-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('data-gallery-src');
        if (!src) return;
        applyVariantSelection(
          thumb.getAttribute('data-variant-sku') || '',
          src,
          thumb.getAttribute('data-variant-label') || ''
        );
      });
    });
  });
  root.querySelectorAll('[data-variant-picker]').forEach((picker) => {
    picker.querySelectorAll('.variant-picker-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyVariantSelection(
          chip.getAttribute('data-variant-sku') || '',
          chip.getAttribute('data-variant-image') || '',
          chip.getAttribute('data-variant-label') || ''
        );
      });
    });
  });
  root.querySelectorAll('[data-variant-row]').forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.closest('[data-add-to-cart]')) return;
      applyVariantSelection(
        row.getAttribute('data-variant-sku') || '',
        row.getAttribute('data-variant-image') || '',
        row.getAttribute('data-variant-label') || ''
      );
    });
  });
  initProductLightbox(root);
  const firstChip = root.querySelector('.variant-picker-chip.is-active');
  if (firstChip) {
    applyVariantSelection(
      firstChip.getAttribute('data-variant-sku') || '',
      firstChip.getAttribute('data-variant-image') || '',
      firstChip.getAttribute('data-variant-label') || ''
    );
  }
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

  root.querySelectorAll('[data-requirements-box]').forEach((box) => {
    const toggle = box.querySelector('[data-requirements-toggle]');
    const panel = box.querySelector('[data-requirements-panel]');
    const textarea = box.querySelector('[data-requirements-text]');
    const addBtn = box.querySelector('[data-requirements-add]');
    const status = box.querySelector('[data-requirements-status]');
    toggle?.addEventListener('click', () => {
      if (!panel) return;
      panel.hidden = !panel.hidden;
    });
    addBtn?.addEventListener('click', () => {
      const text = (textarea?.value || '').trim();
      if (!text) {
        if (status) {
          status.hidden = false;
          status.textContent = 'Enter your requirements before adding to the quote.';
        }
        return;
      }
      if (window.SciEngQuoteCart) {
        window.SciEngQuoteCart.addItem({
          productId: addBtn.getAttribute('data-product-id') || '',
          sku: addBtn.getAttribute('data-sku') || '',
          name: addBtn.getAttribute('data-name') || 'Solution',
          variantLabel: 'Requirements: ' + text,
          qty: 1,
        });
        if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
      }
      if (status) {
        status.hidden = false;
        status.textContent = 'Added to quote cart. Open Checkout to submit.';
      }
      if (textarea) textarea.value = '';
    });
  });
}
