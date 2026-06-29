/**
 * Client-side product catalog + inverted-index search.
 * Products load once from data/products.json; _search blobs are precomputed in JSON.
 */
(function (global) {
  'use strict';

  var products = null;
  var byId = null;
  var tokenIndex = null;
  var loadPromise = null;

  function tokenize(text) {
    if (!text) return [];
    return String(text).toLowerCase().match(/[a-z0-9µ/.+-]+/g) || [];
  }

  function buildTokenIndex(list) {
    var index = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var tokens = tokenize(list[i]._search);
      var seen = Object.create(null);
      for (var t = 0; t < tokens.length; t++) {
        var tok = tokens[t];
        if (seen[tok]) continue;
        seen[tok] = 1;
        if (!index[tok]) index[tok] = [];
        index[tok].push(i);
      }
    }
    return index;
  }

  function resolveBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('catalog-search.js') !== -1) {
        return src.replace(/js\/catalog-search\.js.*$/, '');
      }
    }
    return '';
  }

  function load(basePath) {
    if (products) return Promise.resolve(products);
    if (loadPromise) return loadPromise;

    var root = typeof basePath === 'string' ? basePath : resolveBasePath();
    loadPromise = fetch(root + 'data/products.json', { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load product catalog');
        return res.json();
      })
      .then(function (data) {
        products = data.products || [];
        byId = Object.create(null);
        for (var i = 0; i < products.length; i++) {
          byId[products[i].id] = products[i];
        }
        tokenIndex = buildTokenIndex(products);
        return products;
      });

    return loadPromise;
  }

  function scoreProduct(p, terms) {
    var blob = p._search || '';
    var name = (p.name || '').toLowerCase();
    var sku = (p.sku || '').toLowerCase();
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (name.indexOf(term) !== -1) score += 12;
      else if (sku.indexOf(term) !== -1) score += 10;
      else if (blob.indexOf(term) !== -1) score += 4;
      else return -1;
    }
    if (p.featured) score += 2;
    return score;
  }

  function collectIndicesForTerm(term) {
    var set = Object.create(null);
    var keys = Object.keys(tokenIndex);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (key.indexOf(term) === 0 || key.indexOf(term) !== -1) {
        var arr = tokenIndex[key];
        for (var j = 0; j < arr.length; j++) set[arr[j]] = 1;
      }
    }
    if (!Object.keys(set).length) {
      for (var i = 0; i < products.length; i++) {
        if ((products[i]._search || '').indexOf(term) !== -1) set[i] = 1;
      }
    }
    return set;
  }

  function search(query, options) {
    options = options || {};
    var limit = options.limit == null ? 12 : options.limit;
    var category = options.category || null;

    if (!products) return [];

    var terms = tokenize(query).filter(function (t) { return t.length > 1 || /^\d$/.test(t); });
    if (!terms.length) {
      var all = products.slice();
      if (category) all = all.filter(function (p) { return p.category === category; });
      return all
        .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name); })
        .slice(0, limit);
    }

    var candidateSet = null;
    for (var t = 0; t < terms.length; t++) {
      var termSet = collectIndicesForTerm(terms[t]);
      if (candidateSet === null) {
        candidateSet = termSet;
      } else {
        var next = Object.create(null);
        var ids = Object.keys(candidateSet);
        for (var c = 0; c < ids.length; c++) {
          var idx = ids[c];
          if (termSet[idx]) next[idx] = 1;
        }
        candidateSet = next;
      }
    }

    var results = [];
    var indices = Object.keys(candidateSet || {});
    for (var i = 0; i < indices.length; i++) {
      var product = products[indices[i]];
      if (category && product.category !== category) continue;
      var score = scoreProduct(product, terms);
      if (score >= 0) results.push({ product: product, score: score });
    }

    results.sort(function (a, b) {
      return b.score - a.score || a.product.name.localeCompare(b.product.name);
    });

    return results.slice(0, limit).map(function (r) { return r.product; });
  }

  function getById(id) {
    return byId && byId[id] ? byId[id] : null;
  }

  function getCategories() {
    if (!products) return [];
    var map = Object.create(null);
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!map[p.category]) {
        map[p.category] = { id: p.category, label: p.categoryLabel, count: 0 };
      }
      map[p.category].count++;
    }
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });
  }

  function productUrl(id, basePath) {
    var root = basePath || '';
    return root + 'product.html?id=' + encodeURIComponent(id);
  }

  global.SciEngCatalog = {
    load: load,
    search: search,
    getById: getById,
    getCategories: getCategories,
    productUrl: productUrl,
    getAll: function () { return products ? products.slice() : []; }
  };
})(typeof window !== 'undefined' ? window : global);
