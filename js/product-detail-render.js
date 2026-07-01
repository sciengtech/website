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

  function renderMedia(p, base) {
    var images = productImages(p);
    var name = esc(cleanName(p.name));
    if (!images.length) {
      return '<span class="placeholder" aria-hidden="true">◇</span>';
    }

    var mainSrc = p.image || images[0];
    var stage =
      '<div class="product-media-stage">' +
      '<img src="' + base + esc(mainSrc) + '" alt="' + name + '" data-gallery-main />' +
      '</div>';

    if (images.length === 1) {
      return '<div class="product-media-gallery" data-product-gallery>' + stage + '</div>';
    }

    var thumbs = images
      .map(function (src, i) {
        var active = src === mainSrc ? ' is-active' : '';
        return (
          '<button type="button" class="product-media-thumb' + active + '" data-gallery-src="' + base + esc(src) + '" aria-label="View image ' + (i + 1) + '">' +
          '<img src="' + base + esc(src) + '" alt="" loading="lazy" />' +
          '</button>'
        );
      })
      .join('');

    return (
      '<div class="product-media-gallery" data-product-gallery>' +
      stage +
      '<div class="product-media-thumbs" role="list">' +
      thumbs +
      '</div></div>'
    );
  }

  function renderAddToCartBtn(p, opts) {
    opts = opts || {};
    var sku = opts.sku != null ? opts.sku : p.sku || '';
    var name = cleanName(p.name);
    var variantLabel = opts.variantLabel || '';
    return (
      '<button type="button" class="btn btn-ruby" data-add-to-cart' +
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

  function variantColumns(variants) {
    if (!variants.length) return [];
    var skip = { sr: 1, sku: 1 };
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
    var cols = variantColumns(p.variants);
    var head =
      '<thead><tr><th>#</th>' +
      cols
        .map(function (c) {
          return '<th>' + esc(c.label) + '</th>';
        })
        .join('') +
      '<th>SKU</th><th></th></tr></thead>';
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
        return (
          '<tr><td>' +
          esc(row.sr) +
          '</td>' +
          cols
            .map(function (c) {
              return '<td>' + esc(row[c.key] || '') + '</td>';
            })
            .join('') +
          '<td class="mono">' +
          esc(skuClean) +
          '</td><td><button type="button" class="variant-cart-btn" data-add-to-cart data-product-id="' +
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
    var tabs = p.rfqSections
      .map(function (s, i) {
        return (
          '<button type="button" class="rfq-tab' +
          (i === 0 ? ' is-active' : '') +
          '" data-rfq-tab="' +
          esc(s.id) +
          '">' +
          esc(s.title) +
          '</button>'
        );
      })
      .join('');
    var panels = p.rfqSections
      .map(function (s, i) {
        return (
          '<div class="rfq-panel' +
          (i === 0 ? ' is-active' : '') +
          '" data-rfq-panel="' +
          esc(s.id) +
          '">' +
          '<p class="rfq-panel-intro">Share the following parameters for ' +
          esc(s.title.toLowerCase()) +
          ' when requesting a quote:</p>' +
          '<ul class="product-bullet-list rfq-param-list">' +
          s.parameters
            .map(function (param) {
              return '<li>' + esc(param) + '</li>';
            })
            .join('') +
          '</ul></div>'
        );
      })
      .join('');
    return (
      '<div class="product-rfq-section" data-rfq-tabs>' +
      '<h2 class="product-section-title">Specify Your Requirements</h2>' +
      '<div class="rfq-tabs" role="tablist">' +
      tabs +
      '</div>' +
      panels +
      '</div>'
    );
  }

  function renderHeroMeta(p, overline) {
    var name = cleanName(p.name);
    var aliases =
      p.aliases && p.aliases.length ?
        '<p class="product-aliases">' + esc(p.aliases.join(' · ')) + '</p>'
      : '';
    var skuLine =
      p.pageTemplate === 'configurable' && (!p.variants || !p.variants.length) ?
        '<p class="product-sku-line mono">Quote-driven · configure below</p>'
      : '<p class="product-sku-line mono">SKU: ' + esc(p.sku) + '</p>';
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

  function renderComponentBody(p, base) {
    var specs =
      p.techSpecs && p.techSpecs.length ? p.techSpecs
      : p.keyValueSpecs && p.keyValueSpecs.length ? p.keyValueSpecs
      : null;
    return (
      renderOverview(p) +
      renderTwoColBlocks('Features', p.features, 'Applications', p.applications) +
      (specs ? renderSpecTable('SPECIFICATION SHEET', specs) : '') +
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
    var kitIncludes = sc.kitIncludes || [];
    var note = p.customNote ? '<p class="product-custom-note">' + esc(p.customNote) + '</p>' : '';
    var html = renderOverview(p) + note;
    if (demonstrates.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">Overview</h2>' +
        renderBulletList(demonstrates) +
        '</div>';
    }
    html += renderRfqParameters(p);
    if (kitIncludes.length) {
      html +=
        '<div class="product-solution-section"><h2 class="product-section-title">Engagement</h2>' +
        renderBulletList(kitIncludes) +
        '</div>';
    }
    return html + renderCtas(p, base);
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
      'components.html">Components</a> / ' +
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

  function initProductDetailInteractions(root) {
    if (!root) return;
    root.querySelectorAll('[data-product-gallery]').forEach(function (gallery) {
      var main = gallery.querySelector('[data-gallery-main]');
      if (!main) return;
      gallery.querySelectorAll('.product-media-thumb').forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          var src = thumb.getAttribute('data-gallery-src');
          if (!src) return;
          main.src = src;
          gallery.querySelectorAll('.product-media-thumb').forEach(function (t) {
            t.classList.remove('is-active');
          });
          thumb.classList.add('is-active');
        });
      });
    });
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
  }

  global.SciEngProductDetail = {
    render: renderProductDetail,
    initInteractions: initProductDetailInteractions,
  };
})(typeof window !== 'undefined' ? window : globalThis);
