(function () {
  'use strict';

  var base = window.__SITE_BASE__ || '';

  function inject(id, url) {
    var el = document.getElementById(id);
    if (!el) return Promise.resolve();
    return fetch(base + url)
      .then(function (r) {
        if (!r.ok) throw new Error(url);
        return r.text();
      })
      .then(function (html) {
        el.innerHTML = html.replace(/\{\{BASE\}\}/g, base);
      })
      .catch(function () {
        /* offline or missing partial */
      });
  }

  function fixMegaFooter() {
    var foot = document.querySelector('.mega-footer span');
    if (foot && foot.textContent.indexOf('components/search') !== -1) {
      foot.textContent = 'Every component · Request Technical Quote';
    }
  }

  Promise.all([
    inject('site-header', 'partials/header.html'),
    inject('site-footer', 'partials/footer.html'),
    inject('site-search', 'partials/search-panel.html'),
  ]).then(fixMegaFooter);
})();
