(function () {
  'use strict';

  var renderSeq = 0;

  function resolveProductId() {
    if (window.SciEngCatalog && window.SciEngCatalog.resolveProductIdFromLocation) {
      return window.SciEngCatalog.resolveProductIdFromLocation();
    }
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    if (id) return decodeURIComponent(id.trim());
    var hash = (window.location.hash || '').replace(/^#/, '').trim();
    if (hash) {
      if (hash.indexOf('=') !== -1) {
        id = new URLSearchParams(hash).get('id');
        if (id) return decodeURIComponent(id.trim());
      }
      return decodeURIComponent(hash);
    }
    var match = window.location.pathname.match(/\/product\/([^/]+)\/?$/i);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function isProductDetailPage() {
    var path = window.location.pathname;
    return /\/product\.html$/i.test(path) || /\/product\/?$/i.test(path);
  }

  function productPagePath() {
    var path = window.location.pathname;
    if (/\/product\.html$/i.test(path)) return path;
    if (/\/product\/?$/i.test(path)) return path.replace(/\/$/, '') || '/product';
    return null;
  }

  function productIdFromHref(href) {
    if (!href) return null;
    try {
      var url = new URL(href, window.location.href);
      var path = url.pathname.replace(/\/$/, '');
      if (!/\/product(?:\.html)?$/i.test(path)) return null;
      var hash = (url.hash || '').replace(/^#/, '').trim();
      if (hash) {
        if (hash.indexOf('=') !== -1) {
          var hashId = new URLSearchParams(hash).get('id');
          if (hashId) return decodeURIComponent(hashId.trim());
        }
        return decodeURIComponent(hash);
      }
      var queryId = url.searchParams.get('id');
      return queryId ? decodeURIComponent(queryId.trim()) : null;
    } catch (err) {
      return null;
    }
  }

  function productUrlForId(id) {
    var path = productPagePath() || '/product.html';
    return path + '#' + encodeURIComponent(id);
  }

  function renderNotFound() {
    document.title = 'Component Not Found | SciEngTech';
    var main = document.getElementById('productMain');
    if (!main) return;
    main.innerHTML =
      '<div class="wrap product-not-found"><h1>Specification not found</h1>' +
      '<p style="color:var(--text-muted);margin-bottom:24px">Browse the catalog or submit an RFQ.</p>' +
      '<div class="product-ctas" style="justify-content:center">' +
      '<a class="btn btn-ruby" href="' + (window.__SITE_BASE__ || '') + 'components.html">Browse Catalog</a></div></div>';
  }

  function renderProduct(product) {
    if (!window.SciEngProductDetail || typeof window.SciEngProductDetail.render !== 'function') {
      renderNotFound();
      return;
    }
    document.title = product.name.replace(/^['']|['']$/g, '') + ' | SciEngTech';
    var base = window.__SITE_BASE__ || '';
    var main = document.getElementById('productMain');
    main.innerHTML = window.SciEngProductDetail.render(product, base);
    window.SciEngProductDetail.initInteractions(main);
    if (window.SciEngCartUI) window.SciEngCartUI.init(main);
  }

  function showLoading() {
    var main = document.getElementById('productMain');
    if (!main) return;
    main.innerHTML = '<div class="wrap"><p class="catalog-meta">Loading…</p></div>';
  }

  function loadAndRenderProduct() {
    var id = resolveProductId();
    var seq = ++renderSeq;
    if (!id) {
      renderNotFound();
      return;
    }
    if (!window.SciEngCatalog || typeof window.SciEngCatalog.load !== 'function') {
      renderNotFound();
      return;
    }
    showLoading();
    window.SciEngCatalog.load()
      .then(function () {
        if (seq !== renderSeq) return;
        var product = window.SciEngCatalog.getById(id);
        if (!product) {
          renderNotFound();
          return;
        }
        renderProduct(product);
        window.scrollTo(0, 0);
      })
      .catch(function () {
        if (seq !== renderSeq) return;
        renderNotFound();
      });
  }

  function navigateToProduct(id, replaceHistory) {
    if (!id || !isProductDetailPage()) return false;
    var current = resolveProductId();
    var nextUrl = productUrlForId(id);
    if (current === id && window.location.hash === '#' + encodeURIComponent(id)) {
      return true;
    }
    if (replaceHistory) {
      history.replaceState({ productId: id }, '', nextUrl);
    } else {
      history.pushState({ productId: id }, '', nextUrl);
    }
    loadAndRenderProduct();
    if (window.SciEngHeaderSearch && typeof window.SciEngHeaderSearch.close === 'function') {
      window.SciEngHeaderSearch.close();
    }
    return true;
  }

  document.addEventListener(
    'click',
    function (e) {
      if (!isProductDetailPage()) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest('a[href]');
      if (!link) return;
      if (link.target && link.target !== '_self') return;

      var id = productIdFromHref(link.href);
      if (!id) return;

      try {
        var target = new URL(link.href, window.location.href);
        if (target.origin !== window.location.origin) return;
        var targetPath = target.pathname.replace(/\/$/, '');
        if (!/\/product(?:\.html)?$/i.test(targetPath)) return;
      } catch (err) {
        return;
      }

      e.preventDefault();
      navigateToProduct(id, false);
    },
    true
  );

  window.addEventListener('hashchange', function () {
    if (!isProductDetailPage()) return;
    loadAndRenderProduct();
  });

  window.addEventListener('popstate', function () {
    if (!isProductDetailPage()) return;
    loadAndRenderProduct();
  });

  loadAndRenderProduct();
})();
