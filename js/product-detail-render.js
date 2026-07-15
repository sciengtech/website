/**
 * Browser build of product detail renderer (mirrors scripts/product-detail-template.mjs).
 */
(function (global) {
  'use strict';

  var SOLUTION_GROUP_LABELS = {
    'quantum-setups': 'Quantum Set-Ups',
    'training-kits': 'Training Kits',
    'state-of-the-art-setups': 'State of the Art Setups',
  };

  function solutionGroupLabel(slug) {
    return SOLUTION_GROUP_LABELS[slug] || 'Solutions';
  }

  function solutionGroupHubUrl(slug, base) {
    return base + 'solutions/' + slug + '.html';
  }

  function esc(s) {
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
    if (p.images && p.images.length) return p.images;
    if (p.image) return [p.image];
    return [];
  }

  function variantsWithImages(p) {
    if (!p.variants || !p.variants.length) return [];
    return p.variants.filter(function (v) {
      return v.image;
    });
  }

  function variantLabelForRow(row) {
    var cols = variantColumns([row]);
    return cols
      .map(function (c) {
        return row[c.key] || '';
      })
      .filter(Boolean)
      .join(' · ');
  }

  function variantForImagePath(p, src) {
    var variants = variantsWithImages(p);
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].image === src) return variants[i];
    }
    return null;
  }

  function renderVariantPicker(p, base) {
    var variants = variantsWithImages(p);
    if (!variants.length) return '';
    var chips = variants
      .map(function (row, i) {
        var sku = String(row.sku || row.product_code || row.set_code || '').replace(/\s+/g, '');
        var cols = variantColumns([row]);
        var label = cols
          .map(function (c) {
            return row[c.key] || '';
          })
          .filter(Boolean)
          .join(' · ');
        var chipLabel = label ? sku + ' · ' + label : sku;
        return (
          '<button type="button" class="variant-picker-chip' +
          (i === 0 ? ' is-active' : '') +
          '"' +
          ' data-variant-sku="' +
          esc(sku) +
          '"' +
          ' data-variant-image="' +
          base +
          esc(row.image) +
          '"' +
          ' data-variant-label="' +
          esc(label) +
          '"' +
          ' aria-pressed="' +
          (i === 0 ? 'true' : 'false') +
          '">' +
          esc(chipLabel) +
          '</button>'
        );
      })
      .join('');
    return '<div class="product-variant-picker" data-variant-picker role="list">' + chips + '</div>';
  }

  function renderMedia(p, base) {
    var images = productImages(p);
    var name = esc(cleanName(p.name));
    if (!images.length) {
      return '<span class="placeholder" aria-hidden="true">◇</span>';
    }

    var imageVariants = variantsWithImages(p);
    var mainSrc =
      imageVariants.length ? imageVariants[0].image : p.image || images[0];
    var stage =
      '<button type="button" class="product-media-stage" data-gallery-open aria-label="View ' +
      name +
      ' fullscreen">' +
      '<img src="' +
      base +
      esc(mainSrc) +
      '" alt="' +
      name +
      '" data-gallery-main />' +
      '</button>';

    var picker = renderVariantPicker(p, base);
    var galleryAttrs =
      ' data-product-gallery data-default-sku="' + esc(p.sku || '') + '"';
    if (images.length === 1) {
      return '<div class="product-media-gallery"' + galleryAttrs + '>' + stage + picker + '</div>';
    }

    var thumbs = images
      .map(function (src, i) {
        var active = src === mainSrc ? ' is-active' : '';
        var variant = variantForImagePath(p, src);
        var variantSku = variant
          ? String(variant.sku || variant.product_code || variant.set_code || '').replace(/\s+/g, '')
          : '';
        var variantLabel = variant ? variantLabelForRow(variant) : '';
        var variantAttrs = variant
          ? ' data-variant-sku="' +
            esc(variantSku) +
            '" data-variant-label="' +
            esc(variantLabel) +
            '"'
          : '';
        return (
          '<button type="button" class="product-media-thumb' +
          active +
          '" data-gallery-src="' +
          base +
          esc(src) +
          '"' +
          variantAttrs +
          ' aria-label="View image ' +
          (i + 1) +
          '">' +
          '<img src="' +
          base +
          esc(src) +
          '" alt="" loading="lazy" />' +
          '</button>'
        );
      })
      .join('');

    return (
      '<div class="product-media-gallery"' +
      galleryAttrs +
      '>' +
      stage +
      '<div class="product-media-thumbs" role="list">' +
      thumbs +
      '</div>' +
      picker +
      '</div>'
    );
  }

  function renderAddToCartBtn(p, opts) {
    opts = opts || {};
    var sku = opts.sku != null ? opts.sku : p.sku || '';
    var name = cleanName(p.name);
    var variantLabel = opts.variantLabel || '';
    return (
      '<button type="button" class="btn btn-ruby" data-add-to-cart data-product-cart-btn' +
      ' data-product-id="' +
      esc(p.id) +
      '" data-sku="' +
      esc(sku) +
      '" data-name="' +
      esc(name) +
      '"' +
      (variantLabel ? ' data-variant-label="' + esc(variantLabel) + '"' : '') +
      '>Add to Cart</button>'
    );
  }

  function renderCtas(p, base) {
    return (
      '<div class="product-ctas">' +
      renderAddToCartBtn(p) +
      '<a class="btn btn-outline" href="' +
      base +
      'engineering/rfq.html">Checkout</a>' +
      '</div>'
    );
  }

  function renderBulletList(items, className) {
    if (!items || !items.length) return '';
    className = className || 'product-bullet-list';
    return (
      '<ul class="' +
      className +
      '">' +
      items.map(function (i) {
        return '<li>' + esc(i) + '</li>';
      }).join('') +
      '</ul>'
    );
  }

  function renderTwoColBlocks(leftTitle, leftItems, rightTitle, rightItems) {
    if ((!leftItems || !leftItems.length) && (!rightItems || !rightItems.length)) return '';
    var html = '<div class="product-detail-blocks">';
    if (leftItems && leftItems.length) {
      html +=
        '<div class="product-detail-block"><h2 class="product-section-title">' +
        esc(leftTitle) +
        '</h2>' +
        renderBulletList(leftItems) +
        '</div>';
    }
    if (rightItems && rightItems.length) {
      html +=
        '<div class="product-detail-block"><h2 class="product-section-title">' +
        esc(rightTitle) +
        '</h2>' +
        renderBulletList(rightItems) +
        '</div>';
    }
    return html + '</div>';
  }

  function renderSpecTable(header, rows) {
    if (!rows || !rows.length) return '';
    return (
      '<div class="spec-table-detail"><header>' +
      esc(header) +
      '</header>' +
      rows
        .map(function (r) {
          return (
            '<div class="spec-row"><span>' +
            esc(r.label) +
            '</span><span>' +
            esc(r.value) +
            '</span></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderOverview(p) {
    var paras = p.overview && p.overview.length ? p.overview : p.summary ? [p.summary] : [];
    if (!paras.length) return '';
    return (
      '<div class="product-summary">' +
      paras
        .map(function (para) {
          return '<p>' + esc(para) + '</p>';
        })
        .join('') +
      '</div>'
    );
  }

  function variantColumns(variants, opts) {
    if (!variants.length) return [];
    var skip = { sr: 1, sku: 1, image: 1 };
    if (opts && opts.hideSkuColumn) {
      skip.product_code = 1;
      skip.set_code = 1;
    }
    var keys = Object.keys(variants[0]).filter(function (k) {
      return !skip[k];
    });
    return keys.map(function (k) {
      return {
        key: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        }),
      };
    });
  }

  function renderVariantTable(p, base) {
    if (!p.variants || !p.variants.length) return '';
    var hideSr = !!p.hideSrColumn;
    var hideSku = !!p.hideSkuColumn;
    var cols = variantColumns(p.variants, { hideSkuColumn: hideSku });
    var head =
      '<thead><tr>' +
      (hideSr ? '' : '<th>#</th>') +
      cols
        .map(function (c) {
          return '<th>' + esc(c.label) + '</th>';
        })
        .join('') +
      (hideSku ? '' : '<th>Product Code</th>') +
      '<th></th></tr></thead>';
    var body = p.variants
      .map(function (row) {
        var sku = row.sku || row.product_code || row.set_code || '';
        var skuClean = String(sku).replace(/\s+/g, '');
        var variantLabel = cols
          .map(function (c) {
            return row[c.key] || '';
          })
          .filter(Boolean)
          .join(' · ');
        var rowAttrs = row.image
          ? ' class="variant-row-selectable" data-variant-row data-variant-sku="' +
            esc(skuClean) +
            '" data-variant-image="' +
            base +
            esc(row.image) +
            '" data-variant-label="' +
            esc(variantLabel) +
            '"'
          : '';
        return (
          '<tr' +
          rowAttrs +
          '>' +
          (hideSr ? '' : '<td>' + esc(row.sr) + '</td>') +
          cols
            .map(function (c) {
              return '<td>' + esc(row[c.key] || '') + '</td>';
            })
            .join('') +
          (hideSku ? '' : '<td class="mono">' + esc(skuClean) + '</td>') +
          '<td><button type="button" class="variant-cart-btn" data-add-to-cart data-product-id="' +
          esc(p.id) +
          '" data-sku="' +
          esc(skuClean) +
          '" data-name="' +
          esc(cleanName(p.name)) +
          '" data-variant-label="' +
          esc(variantLabel) +
          '">Add</button></td></tr>'
        );
      })
      .join('');
    var note = p.customNote ? '<p class="product-variant-note">' + esc(p.customNote) + '</p>' : '';
    return (
      '<div class="product-variant-section">' +
      '<h2 class="product-section-title">Available Configurations</h2>' +
      '<div class="product-variant-table-wrap">' +
      '<table class="product-variant-table">' +
      head +
      '<tbody>' +
      body +
      '</tbody></table></div>' +
      note +
      '</div>'
    );
  }

  function renderConfigurationOptions(p) {
    var opts = p.configurationOptions;
    if (!opts || !Object.keys(opts).length) return '';
    var chips = Object.keys(opts)
      .map(function (key) {
        var values = opts[key];
        var label = key.replace(/_/g, ' ').replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        });
        return (
          '<div class="config-option-group">' +
          '<span class="config-option-label">' +
          esc(label) +
          '</span>' +
          '<div class="config-option-values">' +
          values
            .map(function (v) {
              return '<span class="config-chip">' + esc(v) + '</span>';
            })
            .join('') +
          '</div></div>'
        );
      })
      .join('');
    return (
      '<div class="product-config-section">' +
      '<h2 class="product-section-title">Configuration Options</h2>' +
      '<p class="product-config-hint">Select combinations when requesting a quote — pricing varies by configuration.</p>' +
      chips +
      '</div>'
    );
  }

  function renderRfqParameters(p) {
    if (!p.rfqSections || !p.rfqSections.length) return '';
    var hints = [];
    p.rfqSections.forEach(function (s) {
      (s.parameters || []).forEach(function (param) {
        if (param && hints.length < 8) hints.push(param);
      });
    });
    var hintList = hints.length
      ? '<ul class="product-bullet-list rfq-param-list" data-requirements-hints>' +
        hints
          .map(function (param) {
            return '<li>' + esc(param) + '</li>';
          })
          .join('') +
        '</ul>'
      : '';
    return (
      '<div class="product-rfq-section" data-requirements-box>' +
      '<button type="button" class="btn btn-outline" data-requirements-toggle>Specify Your Requirements</button>' +
      '<div class="requirements-panel" data-requirements-panel hidden>' +
      '<p class="rfq-panel-intro">Describe the configuration, wavelengths, quantities, or other details you need. This note is added to your quote cart.</p>' +
      hintList +
      '<textarea class="requirements-textarea" data-requirements-text rows="5" placeholder="e.g. wavelength, pulse width, mounting constraints…"></textarea>' +
      '<button type="button" class="btn btn-ruby" data-requirements-add data-product-id="' +
      esc(p.id) +
      '" data-sku="' +
      esc(p.sku || '') +
      '" data-name="' +
      esc(cleanName(p.name)) +
      '">Add requirements to quote</button>' +
      '<p class="requirements-status" data-requirements-status hidden></p>' +
      '</div></div>'
    );
  }

  function renderHeroMeta(p, overline) {
    var name = cleanName(p.name);
    var aliases =
      p.aliases && p.aliases.length ?
        '<p class="product-aliases">' + esc(p.aliases.join(' · ')) + '</p>'
      : '';
    var imageVariants = variantsWithImages(p);
    var defaultSku =
      imageVariants.length ?
        String(imageVariants[0].sku || imageVariants[0].product_code || '').replace(/\s+/g, '')
      : p.sku;
    var skuLine =
      p.pageTemplate === 'variant-catalog' ?
        ''
      : p.pageTemplate === 'configurable' && (!p.variants || !p.variants.length) ?
        '<p class="product-sku-line mono">Quote-driven · configure below</p>'
      : '<p class="product-sku-line mono" data-product-sku-line>Product Code: ' + esc(defaultSku) + '</p>';
    var highlight =
      p.pageTemplate === 'solution' ? ''
      : p.specHighlight ? '<p class="product-highlight mono">' + esc(p.specHighlight) + '</p>'
      : '';
    var tagline =
      p.solutionContent && p.solutionContent.tagline ?
        '<p class="product-tagline">' + esc(p.solutionContent.tagline) + '</p>'
      : '';
    return (
      '<p class="product-overline">' +
      esc(overline) +
      '</p><h1>' +
      esc(name) +
      '</h1>' +
      aliases +
      skuLine +
      tagline +
      highlight
    );
  }

  function renderSpecSections(p) {
    if (!p.specSections || !p.specSections.length) return '';
    var tabs = p.specSections
      .map(function (s, i) {
        return (
          '<button type="button" class="rfq-tab' +
          (i === 0 ? ' is-active' : '') +
          '" data-rfq-tab="' +
          esc(s.id) +
          '" role="tab">' +
          esc(s.title) +
          '</button>'
        );
      })
      .join('');
    var panels = p.specSections
      .map(function (s, i) {
        return (
          '<div class="rfq-panel' +
          (i === 0 ? ' is-active' : '') +
          '" data-rfq-panel="' +
          esc(s.id) +
          '">' +
          renderSpecTable('Key Features', s.specs || []) +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="product-rfq-section product-spec-tabs" data-rfq-tabs>' +
      '<div class="rfq-tabs" role="tablist">' +
      tabs +
      '</div>' +
      panels +
      '</div>'
    );
  }

  function renderComponentBody(p, base) {
    var specs =
      p.techSpecs && p.techSpecs.length ? p.techSpecs
      : !p.specSections?.length && p.keyValueSpecs && p.keyValueSpecs.length ? p.keyValueSpecs
      : null;
    var note = p.customNote ? '<p class="product-custom-note">' + esc(p.customNote) + '</p>' : '';
    return (
      renderOverview(p) +
      renderTwoColBlocks('Features', p.features, 'Applications', p.applications) +
      (specs ? renderSpecTable('SPECIFICATION SHEET', specs) : '') +
      renderSpecSections(p) +
      note +
      renderCtas(p, base)
    );
  }

  function renderSolutionBody(p, base) {
    var sc = p.solutionContent || {};
    var demonstrates = sc.demonstrates && sc.demonstrates.length ? sc.demonstrates : p.features;
    var kitIncludes = sc.kitIncludes || [];
    var capabilities = sc.capabilities && sc.capabilities.length ? sc.capabilities : [];
    var showOverview = p.overview && p.overview.length && (!demonstrates || !demonstrates.length);
    var html = showOverview ? renderOverview(p) : '';
    if (demonstrates && demonstrates.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">What This Kit Demonstrates</h2>' +
        renderBulletList(demonstrates) +
        '</div>';
    }
    if (kitIncludes.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">What\'s Included</h2>' +
        renderBulletList(kitIncludes) +
        '</div>';
    }
    if (capabilities.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">Key Capabilities</h2>' +
        renderBulletList(capabilities) +
        '</div>';
    }
    return html + renderCtas(p, base);
  }

  function renderCustomSolutionBody(p, base) {
    var sc = p.solutionContent || {};
    var demonstrates = sc.demonstrates || [];
    var note = p.customNote ? '<p class="product-custom-note">' + esc(p.customNote) + '</p>' : '';
    var html = renderOverview(p) + note;
    if (demonstrates.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">Overview</h2>' +
        renderBulletList(demonstrates) +
        '</div>';
    }
    html += renderRfqParameters(p);
    return html + renderCtas(p, base);
  }

  function renderHtmlBody(p, base) {
    var html = String(p.htmlBody || '').trim();
    var content = html ?
      '<div class="product-html-body knowledge-prose">' + html + '</div>'
    : '<p class="product-empty-note">Product details coming soon.</p>';
    return content + renderCtas(p, base);
  }

  function renderProductDetailMain(p, base, breadcrumbHtml) {
    var template = p.pageTemplate || (p.type === 'solution' ? 'solution' : 'component');
    var overline =
      p.type === 'solution' ?
        p.categoryLabel || solutionGroupLabel(p.solutionGroup)
      : p.categoryLabel || 'Component';
    var body = '';
    switch (template) {
      case 'solution':
        body = renderSolutionBody(p, base);
        break;
      case 'variant-catalog':
        body =
          renderOverview(p) +
          renderTwoColBlocks('Features', p.features, 'Applications', p.applications) +
          renderVariantTable(p, base) +
          (p.techSpecs && p.techSpecs.length ?
            renderSpecTable('TECHNICAL SPECIFICATIONS', p.techSpecs)
          : '') +
          renderCtas(p, base);
        break;
      case 'configurable':
        body =
          p.type === 'solution' ?
            renderCustomSolutionBody(p, base)
          : renderOverview(p) +
            renderConfigurationOptions(p) +
            renderRfqParameters(p) +
            renderTwoColBlocks('Features', p.features, 'Applications', p.applications) +
            renderCtas(p, base);
        break;
      case 'rich-page':
        body = renderHtmlBody(p, base);
        break;
      default:
        body = renderComponentBody(p, base);
    }
    return (
      '<div class="wrap">' +
      breadcrumbHtml +
      '<div class="product-detail-grid">' +
      '<div class="product-detail-media">' +
      renderMedia(p, base) +
      '</div>' +
      '<div class="product-detail-main">' +
      renderHeroMeta(p, overline) +
      body +
      '</div></div></div>'
    );
  }

  function renderComponentBreadcrumb(p, base) {
    var name = cleanName(p.name);
    return (
      '<nav class="product-breadcrumb" aria-label="Breadcrumb">' +
      '<a href="' +
      base +
      'index.html">Home</a> / ' +
      '<a href="' +
      base +
      'components.html">Categories</a> / ' +
      '<a href="' +
      base +
      'components/' +
      esc(p.category) +
      '.html">' +
      esc(p.categoryLabel) +
      '</a> / ' +
      '<span>' +
      esc(name) +
      '</span></nav>'
    );
  }

  function renderSolutionBreadcrumb(p, base) {
    var name = cleanName(p.name);
    var groupLabel = p.categoryLabel || solutionGroupLabel(p.solutionGroup);
    var groupUrl = solutionGroupHubUrl(p.solutionGroup, base);
    return (
      '<nav class="product-breadcrumb" aria-label="Breadcrumb">' +
      '<a href="' +
      base +
      'index.html">Home</a> / ' +
      '<a href="' +
      base +
      'solutions.html">Solutions</a> / ' +
      '<a href="' +
      groupUrl +
      '">' +
      esc(groupLabel) +
      '</a> / ' +
      '<span>' +
      esc(name) +
      '</span></nav>'
    );
  }

  function renderProductDetail(p, base) {
    base = base || '';
    var breadcrumb =
      p.type === 'solution' ? renderSolutionBreadcrumb(p, base) : renderComponentBreadcrumb(p, base);
    var template = p.pageTemplate || (p.type === 'solution' ? 'solution' : 'component');
    return (
      '<section class="product-detail product-detail--' +
      esc(template) +
      '">' +
      renderProductDetailMain(p, base, breadcrumb) +
      '</section>'
    );
  }

  function initProductLightbox(root) {
    var lightbox = document.getElementById('productLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'productLightbox';
      lightbox.className = 'product-lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Product image viewer');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.innerHTML =
        '<button type="button" class="product-lightbox__backdrop" data-lightbox-close aria-label="Close image viewer"></button>' +
        '<button type="button" class="product-lightbox__close" data-lightbox-close aria-label="Close">&times;</button>' +
        '<button type="button" class="product-lightbox__nav product-lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">&#8249;</button>' +
        '<button type="button" class="product-lightbox__nav product-lightbox__nav--next" data-lightbox-next aria-label="Next image">&#8250;</button>' +
        '<div class="product-lightbox__panel">' +
        '<div class="product-lightbox__stage"><img src="" alt="" data-lightbox-img /></div>' +
        '<p class="product-lightbox__counter" data-lightbox-counter hidden></p>' +
        '</div>';
      document.body.appendChild(lightbox);
    }

    var state = { sources: [], index: 0, alt: '' };
    var img = lightbox.querySelector('[data-lightbox-img]');
    var counter = lightbox.querySelector('[data-lightbox-counter]');
    var prevBtn = lightbox.querySelector('[data-lightbox-prev]');
    var nextBtn = lightbox.querySelector('[data-lightbox-next]');

    function gallerySources(gallery) {
      var thumbs = gallery.querySelectorAll('.product-media-thumb[data-gallery-src]');
      if (thumbs.length) {
        return Array.prototype.map.call(thumbs, function (thumb) {
          return thumb.getAttribute('data-gallery-src') || '';
        }).filter(Boolean);
      }
      var main = gallery.querySelector('[data-gallery-main]');
      return main && main.src ? [main.src] : [];
    }

    function currentIndex(sources, main) {
      if (!main || !sources.length) return 0;
      var src = main.getAttribute('src') || main.src;
      var idx = sources.indexOf(src);
      return idx >= 0 ? idx : 0;
    }

    function updateLightbox() {
      if (!img || !state.sources.length) return;
      img.src = state.sources[state.index];
      img.alt = state.alt;
      if (counter) {
        if (state.sources.length > 1) {
          counter.hidden = false;
          counter.textContent = state.index + 1 + ' / ' + state.sources.length;
        } else {
          counter.hidden = true;
          counter.textContent = '';
        }
      }
      if (prevBtn) prevBtn.disabled = state.index <= 0;
      if (nextBtn) nextBtn.disabled = state.index >= state.sources.length - 1;
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('product-lightbox-open');
    }

    function openLightbox(sources, index, alt) {
      if (!sources.length) return;
      state.sources = sources;
      state.index = index;
      state.alt = alt || '';
      updateLightbox();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('product-lightbox-open');
      var closeBtn = lightbox.querySelector('.product-lightbox__close');
      if (closeBtn) closeBtn.focus();
    }

    if (!lightbox.dataset.bound) {
      lightbox.dataset.bound = 'true';
      lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (btn) {
        btn.addEventListener('click', closeLightbox);
      });
      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          if (state.index > 0) {
            state.index -= 1;
            updateLightbox();
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          if (state.index < state.sources.length - 1) {
            state.index += 1;
            updateLightbox();
          }
        });
      }
      document.addEventListener('keydown', function (e) {
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

    root.querySelectorAll('[data-product-gallery]').forEach(function (gallery) {
      var stage = gallery.querySelector('[data-gallery-open], .product-media-stage');
      if (!stage || stage.dataset.lightboxBound) return;
      stage.dataset.lightboxBound = 'true';
      stage.addEventListener('click', function () {
        var main = gallery.querySelector('[data-gallery-main]');
        var sources = gallerySources(gallery);
        if (!sources.length) return;
        openLightbox(sources, currentIndex(sources, main), main ? main.alt : '');
      });
    });
  }

  function initProductDetailInteractions(root) {
    if (!root) return;

    function applyVariantSelection(sku, imageSrc, label) {
      var gallery = root.querySelector('[data-product-gallery]');
      var main = gallery ? gallery.querySelector('[data-gallery-main]') : null;
      if (main && imageSrc) {
        main.src = imageSrc;
        if (gallery) {
          gallery.querySelectorAll('.product-media-thumb').forEach(function (thumb) {
            var thumbSrc = thumb.getAttribute('data-gallery-src') || '';
            thumb.classList.toggle('is-active', thumbSrc === imageSrc);
          });
        }
      }
      var defaultSku = gallery ? gallery.getAttribute('data-default-sku') || '' : '';
      var activeSku = sku || defaultSku;
      var skuLine = root.querySelector('[data-product-sku-line]');
      if (skuLine && activeSku) skuLine.textContent = 'Product Code: ' + activeSku;
      root.querySelectorAll('[data-product-cart-btn]').forEach(function (btn) {
        if (activeSku) btn.setAttribute('data-sku', activeSku);
        if (sku && label) btn.setAttribute('data-variant-label', label);
        else btn.removeAttribute('data-variant-label');
      });
      root.querySelectorAll('.variant-picker-chip').forEach(function (chip) {
        var active = Boolean(sku) && chip.getAttribute('data-variant-sku') === sku;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      root.querySelectorAll('[data-variant-row]').forEach(function (row) {
        row.classList.toggle('is-selected', Boolean(sku) && row.getAttribute('data-variant-sku') === sku);
      });
    }

    root.querySelectorAll('[data-product-gallery]').forEach(function (gallery) {
      var main = gallery.querySelector('[data-gallery-main]');
      if (!main) return;
      gallery.querySelectorAll('.product-media-thumb').forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          var src = thumb.getAttribute('data-gallery-src');
          if (!src) return;
          applyVariantSelection(
            thumb.getAttribute('data-variant-sku') || '',
            src,
            thumb.getAttribute('data-variant-label') || ''
          );
        });
      });
    });
    root.querySelectorAll('[data-variant-picker]').forEach(function (picker) {
      picker.querySelectorAll('.variant-picker-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          applyVariantSelection(
            chip.getAttribute('data-variant-sku') || '',
            chip.getAttribute('data-variant-image') || '',
            chip.getAttribute('data-variant-label') || ''
          );
        });
      });
    });
    root.querySelectorAll('[data-variant-row]').forEach(function (row) {
      row.addEventListener('click', function (event) {
        if (event.target.closest('[data-add-to-cart]')) return;
        applyVariantSelection(
          row.getAttribute('data-variant-sku') || '',
          row.getAttribute('data-variant-image') || '',
          row.getAttribute('data-variant-label') || ''
        );
      });
    });
    initProductLightbox(root);
    var firstChip = root.querySelector('.variant-picker-chip.is-active');
    if (firstChip) {
      applyVariantSelection(
        firstChip.getAttribute('data-variant-sku') || '',
        firstChip.getAttribute('data-variant-image') || '',
        firstChip.getAttribute('data-variant-label') || ''
      );
    }
    root.querySelectorAll('[data-rfq-tabs]').forEach(function (wrap) {
      wrap.querySelectorAll('.rfq-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var id = tab.getAttribute('data-rfq-tab');
          wrap.querySelectorAll('.rfq-tab').forEach(function (t) {
            t.classList.remove('is-active');
          });
          wrap.querySelectorAll('.rfq-panel').forEach(function (panel) {
            panel.classList.remove('is-active');
          });
          tab.classList.add('is-active');
          var panel = wrap.querySelector('[data-rfq-panel="' + id + '"]');
          if (panel) panel.classList.add('is-active');
        });
      });
    });

  root.querySelectorAll('[data-requirements-box]').forEach(function (box) {
    var toggle = box.querySelector('[data-requirements-toggle]');
    var panel = box.querySelector('[data-requirements-panel]');
    var textarea = box.querySelector('[data-requirements-text]');
    var addBtn = box.querySelector('[data-requirements-add]');
    var status = box.querySelector('[data-requirements-status]');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.hidden = !panel.hidden;
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var textVal = ((textarea && textarea.value) || '').trim();
        if (!textVal) {
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
            variantLabel: 'Requirements: ' + textVal,
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
    }
  });

  }

  global.SciEngProductDetail = {
    render: renderProductDetail,
    initInteractions: initProductDetailInteractions,
  };
})(typeof window !== 'undefined' ? window : globalThis);
