(function () {
  'use strict';

  var activeCategory = '';
  var activeType = '';
  var debounceTimer = null;
  var mode = 'full';
  var filtersBound = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function assetUrl(path) {
    if (!path) return '';
    var base = window.__SITE_BASE__ || '';
    if (path.indexOf('http') === 0 || path.indexOf('//') === 0) return path;
    return base + path;
  }

  /** Prefer primary image; fall back to gallery or first variant image. */
  function listingImage(p) {
    if (!p) return null;
    if (p.image) return p.image;
    if (p.images && p.images.length) return p.images[0];
    if (p.variants) {
      for (var i = 0; i < p.variants.length; i++) {
        if (p.variants[i].image) return p.variants[i].image;
      }
    }
    return null;
  }

  function itemUrl(p) {
    var base = window.__SITE_BASE__ || '';
    if (p.url) return base + p.url;
    return window.SciEngCatalog.productUrl(p.id);
  }

  function renderTypeFilters() {
    var wrap = document.getElementById('catalogTypeFilters');
    if (!wrap || mode !== 'full') return;

    var types = [
      { id: '', label: 'All items' },
      { id: 'solution', label: 'Solutions' },
      { id: 'component', label: 'Components' },
    ];

    var html = '';
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      html +=
        '<button type="button" class="filter-chip filter-chip--type' +
        (activeType === t.id ? ' is-active' : '') +
        '" data-type="' +
        escapeHtml(t.id) +
        '">' +
        escapeHtml(t.label) +
        '</button>';
    }
    wrap.innerHTML = html;
  }

  function renderCategoryFilters() {
    var wrap = document.getElementById('catalogFilters');
    if (!wrap || !window.SciEngCatalog) return;

    var categories = window.SciEngCatalog.getFilterCategories({
      type: mode === 'components' ? 'component' : activeType || null,
    });

    var html =
      '<button type="button" class="filter-chip' +
      (activeCategory === '' ? ' is-active' : '') +
      '" data-category="">All categories</button>';

    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      html +=
        '<button type="button" class="filter-chip' +
        (activeCategory === c.id ? ' is-active' : '') +
        '" data-category="' +
        escapeHtml(c.id) +
        '">' +
        escapeHtml(c.label) +
        ' (' +
        c.count +
        ')</button>';
    }
    wrap.innerHTML = html;
  }

  function bindFilters() {
    if (filtersBound) return;
    filtersBound = true;

    var toolbar = document.querySelector('.catalog-toolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', function (e) {
      var typeBtn = e.target.closest('.filter-chip[data-type]');
      if (typeBtn) {
        activeType = typeBtn.getAttribute('data-type') || '';
        document.querySelectorAll('.filter-chip[data-type]').forEach(function (chip) {
          chip.classList.toggle('is-active', chip === typeBtn);
        });
        if (activeCategory) {
          var stillValid = window.SciEngCatalog.getFilterCategories({
            type: mode === 'components' ? 'component' : activeType || null,
          }).some(function (c) {
            return c.id === activeCategory;
          });
          if (!stillValid) activeCategory = '';
        }
        renderCategoryFilters();
        renderGrid();
        return;
      }

      var catBtn = e.target.closest('.filter-chip[data-category]');
      if (catBtn) {
        activeCategory = catBtn.getAttribute('data-category') || '';
        document.querySelectorAll('.filter-chip[data-category]').forEach(function (chip) {
          chip.classList.toggle('is-active', chip === catBtn);
        });
        renderGrid();
      }
    });
  }

  function renderGrid() {
    var input = document.getElementById('catalogSearchInput');
    var grid = document.getElementById('productGrid');
    var meta = document.getElementById('catalogCount');
    if (!grid || !window.SciEngCatalog) return;

    var q = input ? input.value.trim() : '';
    var typeFilter = mode === 'components' ? 'component' : activeType || null;
    var list = window.SciEngCatalog.search(q, {
      limit: 500,
      category: activeCategory || null,
      type: typeFilter,
    });

    var noun = typeFilter === 'solution' ? 'solution' : typeFilter === 'component' ? 'component' : 'item';

    if (meta) {
      meta.textContent =
        list.length +
        ' ' +
        noun +
        (list.length === 1 ? '' : 's') +
        (q ? ' matching "' + q + '"' : '');
    }

    if (!list.length) {
      grid.innerHTML =
        '<p class="search-empty" style="grid-column:1/-1">No matching specifications. Contact a system engineer for custom requirements.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var url = itemUrl(p);
      var img = listingImage(p);
      var media = img
        ? '<img src="' + escapeHtml(assetUrl(img)) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" />'
        : '<span class="placeholder" aria-hidden="true">◇</span>';
      var typeBadge =
        p.type === 'solution'
          ? '<span class="product-card-type">Solution</span>'
          : '<span class="product-card-type product-card-type--component">Component</span>';

      html +=
        '<a class="product-card" href="' +
        escapeHtml(url) +
        '">' +
        '<div class="product-card-media">' +
        media +
        '</div>' +
        '<div class="product-card-body">' +
        (mode === 'full' ? typeBadge : '') +
        '<span class="product-card-cat">' +
        escapeHtml(p.categoryLabel) +
        '</span>' +
        '<h2>' +
        escapeHtml(p.name) +
        '</h2>' +
        '<span class="product-card-spec">' +
        escapeHtml(p.specHighlight) +
        '</span>' +
        '<span class="product-card-sku mono">' +
        escapeHtml(p.sku) +
        '</span>' +
        '</div></a>';
    }
    grid.innerHTML = html;
  }

  function focusCatalogInput() {
    var input = document.getElementById('catalogSearchInput');
    if (!input) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          input.focus({ preventScroll: true });
        } catch (err) {
          input.focus();
        }
      });
    });
  }

  function init() {
    mode = document.documentElement.getAttribute('data-catalog-mode') || 'full';
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    var cat = params.get('category') || '';
    var type = params.get('type') || '';
    var input = document.getElementById('catalogSearchInput');

    if (input && q) input.value = q;
    activeCategory = cat;
    if (mode === 'full' && (type === 'solution' || type === 'component')) {
      activeType = type;
    }

    bindFilters();

    window.SciEngCatalog.load().then(function () {
      renderTypeFilters();
      renderCategoryFilters();
      renderGrid();
    });

    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderGrid, 120);
      });
      focusCatalogInput();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
