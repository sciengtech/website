(function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderNotFound() {
    document.title = 'Component Not Found | SciEngTech';
    document.getElementById('productMain').innerHTML =
      '<div class="wrap product-not-found"><h1>Specification not found</h1>' +
      '<p style="color:var(--text-muted);margin-bottom:24px">Browse the catalog or submit an RFQ.</p>' +
      '<div class="product-ctas" style="justify-content:center">' +
      '<a class="btn btn-ruby" href="' + (window.__SITE_BASE__ || '') + 'components.html">Browse Catalog</a></div></div>';
  }

  function renderProduct(p) {
    var base = window.__SITE_BASE__ || '';
    document.title = p.name.replace(/^['']|['']$/g, '') + ' | SciEngTech';
    var specsHtml = (p.specs || [])
      .map(function (row) {
        return '<div class="spec-row"><span>' + esc(row.label) + '</span><span>' + esc(row.value) + '</span></div>';
      })
      .join('');
    var media = p.image
      ? '<img src="' + base + esc(p.image) + '" alt="' + esc(p.name) + '" />'
      : '<span class="placeholder" aria-hidden="true">◇</span>';
    var name = p.name.replace(/^['']|['']$/g, '');

    document.getElementById('productMain').innerHTML =
      '<div class="wrap">' +
      '<nav class="product-breadcrumb"><a href="' + base + 'index.html">Home</a> / ' +
      '<a href="' + base + 'components.html">Components</a> / ' +
      '<a href="' + base + 'components/' + esc(p.category) + '.html">' + esc(p.categoryLabel) + '</a> / ' +
      '<span>' + esc(name) + '</span></nav>' +
      '<div class="product-detail-grid">' +
      '<div class="product-detail-media">' + media + '</div>' +
      '<div><p class="product-overline">' + esc(p.categoryLabel) + '</p>' +
      '<h1>' + esc(name) + '</h1>' +
      '<p class="product-sku-line mono">SKU: ' + esc(p.sku) + '</p>' +
      '<p class="product-highlight mono">' + esc(p.specHighlight) + '</p>' +
      '<p class="product-summary">' + esc(p.summary) + '</p>' +
      '<div class="spec-table-detail"><header>SPECIFICATION SHEET</header>' + specsHtml + '</div>' +
      '<div class="product-ctas">' +
      '<a class="btn btn-ruby" href="' + base + 'engineering/rfq.html?product=' + encodeURIComponent(p.id) + '">Request Technical Quote</a>' +
      '<a class="btn btn-outline" href="' + base + 'engineering/upload.html">Upload Schematics</a>' +
      '</div></div></div></div>';
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!id) {
    renderNotFound();
    return;
  }

  window.SciEngCatalog.load().then(function () {
    var product = window.SciEngCatalog.getById(id);
    if (!product) renderNotFound();
    else renderProduct(product);
  });
})();
