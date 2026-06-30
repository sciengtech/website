(function () {
  'use strict';

  var activeCategory = '';
  var debounceTimer = null;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderFilters(categories) {
    var wrap = document.getElementById('catalogFilters');
    if (!wrap) return;
    var html =
      '<button type="button" class="filter-chip is-active" data-category="">All</button>';
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      html +=
        '<button type="button" class="filter-chip" data-category="' +
        escapeHtml(c.id) +
        '">' +
        escapeHtml(c.label) +
        ' (' +
        c.count +
        ')</button>';
    }
    wrap.innerHTML = html;
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-chip');
      if (!btn) return;
      activeCategory = btn.getAttribute('data-category') || '';
      wrap.querySelectorAll('.filter-chip').forEach(function (chip) {
        chip.classList.toggle('is-active', chip === btn);
      });
      renderGrid();
    });
  }

  function renderGrid() {
    var input = document.getElementById('catalogSearchInput');
    var grid = document.getElementById('productGrid');
    var meta = document.getElementById('catalogCount');
    if (!grid || !window.SciEngCatalog) return;

    var q = input ? input.value.trim() : '';
    var list = window.SciEngCatalog.search(q, { limit: 500, category: activeCategory || null, type: 'component' });

    if (meta) {
      meta.textContent =
        list.length + ' component' + (list.length === 1 ? '' : 's') + (q ? ' matching "' + q + '"' : '');
    }

    if (!list.length) {
      grid.innerHTML =
        '<p class="search-empty" style="grid-column:1/-1">No matching specifications. Contact a system engineer for custom requirements.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var url = (window.__SITE_BASE__ || '') + 'product.html?id=' + encodeURIComponent(p.id);
      var media = p.image
        ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" />'
        : '<span class="placeholder" aria-hidden="true">◇</span>';
      html +=
        '<a class="product-card" href="' +
        escapeHtml(url) +
        '">' +
        '<div class="product-card-media">' +
        media +
        '</div>' +
        '<div class="product-card-body">' +
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

  function init() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    var cat = params.get('category') || '';
    var input = document.getElementById('catalogSearchInput');

    if (input && q) input.value = q;
    activeCategory = cat;

    window.SciEngCatalog.load().then(function () {
      renderFilters(window.SciEngCatalog.getCategories());
      if (cat) {
        var chip = document.querySelector('.filter-chip[data-category="' + cat + '"]');
        if (chip) chip.click();
      } else {
        renderGrid();
      }
    });

    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderGrid, 120);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
