/**
 * Global header search overlay — works on any page that includes catalog-search.js.
 */
(function () {
  'use strict';

  var DEBOUNCE_MS = 120;
  var debounceTimer = null;
  var activeIndex = -1;
  var currentResults = [];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function thumb(product) {
    var base = window.__SITE_BASE__ || '';
    var img = listingImage(product);
    if (img) {
      return '<img class="search-result-thumb" src="' + escapeHtml(base + img) + '" alt="" loading="lazy" />';
    }
    return '<span class="search-result-thumb search-result-thumb--empty" aria-hidden="true">◇</span>';
  }

  function renderResults(list, query) {
    var resultsEl = document.getElementById('searchResults');
    var statusEl = document.getElementById('searchStatus');
    if (!resultsEl) return;

    currentResults = list;
    activeIndex = -1;

    if (!query) {
      resultsEl.innerHTML = '<p class="search-hint">Type to search solutions, components, SKUs, and specifications.</p>';
      if (statusEl) statusEl.textContent = '';
      return;
    }

    if (!list.length) {
      resultsEl.innerHTML =
        '<p class="search-empty">No matching specifications. <a href="' + (window.__SITE_BASE__ || '') + 'catalog.html?q=' +
        encodeURIComponent(query) +
        '">Browse full catalog</a> or contact a system engineer for custom requirements.</p>';
      if (statusEl) statusEl.textContent = '0 results';
      return;
    }

    var html = '<ul class="search-result-list" role="listbox" id="searchResultList">';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var url = p.url
        ? (window.__SITE_BASE__ || '') + p.url
        : window.SciEngCatalog.productUrl(p.id);
      html +=
        '<li role="option" aria-selected="false">' +
        '<a class="search-result-item" href="' +
        escapeHtml(url) +
        '" data-index="' +
        i +
        '">' +
        thumb(p) +
        '<span class="search-result-body">' +
        '<strong>' +
        escapeHtml(p.name) +
        '</strong>' +
        '<span class="search-result-meta">' +
        escapeHtml(p.categoryLabel) +
        ' · ' +
        escapeHtml(p.specHighlight) +
        '</span>' +
        '<span class="search-result-sku mono">' +
        escapeHtml(p.sku) +
        '</span>' +
        '</span></a></li>';
    }
    html += '</ul>';
    if (list.length >= 12) {
      html +=
        '<a class="search-view-all" href="' + (window.__SITE_BASE__ || '') + 'catalog.html?q=' +
        encodeURIComponent(query) +
        '">View all matches in catalog →</a>';
    }
    resultsEl.innerHTML = html;
    if (statusEl) statusEl.textContent = list.length + (list.length >= 12 ? '+' : '') + ' results';
  }

  function runSearch(query) {
    if (!window.SciEngCatalog) return;
    var list = window.SciEngCatalog.search(query, { limit: 12 });
    renderResults(list, query);
  }

  function focusInput(el) {
    if (!el) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          el.focus({ preventScroll: true });
        } catch (err) {
          el.focus();
        }
      });
    });
  }

  function openPanel() {
    var panel = document.getElementById('searchPanel');
    var input = document.getElementById('globalSearchInput');
    var trigger = document.getElementById('searchTrigger');
    if (!panel || !input) return;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-open');
    if (trigger && document.activeElement === trigger) {
      trigger.blur();
    }
    focusInput(input);
    runSearch(input.value.trim());
  }

  function closePanel() {
    var panel = document.getElementById('searchPanel');
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-open');
    activeIndex = -1;
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.search-result-item')) closePanel();
  });

  function setActive(idx) {
    var items = document.querySelectorAll('.search-result-item');
    for (var i = 0; i < items.length; i++) {
      items[i].parentElement.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      items[i].classList.toggle('is-active', i === idx);
    }
    activeIndex = idx;
    if (idx >= 0 && items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  var initialized = false;
  var triggerBound = false;

  function bindSearchTrigger() {
    if (triggerBound) return;
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('#searchTrigger');
      if (!trigger) return;
      e.preventDefault();
      init();
      openPanel();
    });
    triggerBound = true;
  }

  bindSearchTrigger();

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      init();
      openPanel();
    }
  });

  function init() {
    if (initialized) return;

    var input = document.getElementById('globalSearchInput');
    var panel = document.getElementById('searchPanel');
    var backdrop = document.getElementById('searchBackdrop');
    var closeBtn = document.getElementById('searchClose');

    if (!panel || !input) return;
    initialized = true;

    window.SciEngCatalog.load().catch(function () {
      var resultsEl = document.getElementById('searchResults');
      if (resultsEl) resultsEl.innerHTML = '<p class="search-empty">Catalog unavailable offline.</p>';
    });

    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
      if (!panel.classList.contains('is-open')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(Math.min(activeIndex + 1, currentResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        closePanel();
        window.location.href = window.SciEngCatalog.productUrl(currentResults[activeIndex].id);
      }
    });

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      debounceTimer = setTimeout(function () {
        runSearch(q);
      }, DEBOUNCE_MS);
    });

    var params = new URLSearchParams(window.location.search);
    if (params.get('q') && input) {
      input.value = params.get('q');
      openPanel();
    }
  }

  function tryInit() {
    init();
  }

  window.SciEngHeaderSearch = { init: tryInit, close: closePanel };

  document.addEventListener('site-chrome-ready', tryInit);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
