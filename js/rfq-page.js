/**
 * Checkout page: cart review + contact form → hidden Google Form submit.
 * Empty cart shows Write to us; cart with items requires Institution.
 */
(function () {
  'use strict';

  var base = window.__SITE_BASE__ || '';

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formConfigured() {
    var cfg = window.SciEngGoogleForm;
    if (!cfg || !cfg.formId) return false;
    return !!(cfg.fields.fullName && cfg.fields.email && cfg.fields.orderItems);
  }

  function cartHasItems() {
    return window.SciEngQuoteCart && window.SciEngQuoteCart.read().length > 0;
  }

  function syncFormMode() {
    var hasItems = cartHasItems();
    var title = document.getElementById('checkoutFormTitle');
    var hint = document.getElementById('checkoutFormHint');
    var notesField = document.getElementById('checkoutNotesField');
    var writeField = document.getElementById('checkoutWriteToUsField');
    var submitBtn = document.getElementById('checkoutSubmitBtn');
    var formWrap = document.getElementById('checkoutFormWrap');

    if (formWrap) formWrap.hidden = false;

    if (hasItems) {
      if (title) title.textContent = 'Contact Details';
      if (hint) {
        hint.innerHTML = 'Fields marked <span class="req">*</span> are required.';
      }
      if (notesField) notesField.hidden = false;
      if (writeField) writeField.hidden = true;
      if (submitBtn) submitBtn.textContent = 'Submit Quote Request';
    } else {
      if (title) title.textContent = 'Write to us';
      if (hint) {
        hint.innerHTML =
          'Cart is empty — send a message about products or requirements not listed in the catalog. Fields marked <span class="req">*</span> are required.';
      }
      if (notesField) notesField.hidden = true;
      if (writeField) writeField.hidden = false;
      if (submitBtn) submitBtn.textContent = 'Send message';
    }
  }

  function mergeQueryProduct() {
    var params = new URLSearchParams(window.location.search);
    var productId = params.get('product');
    if (!productId || !window.SciEngCatalog || !window.SciEngQuoteCart) return;

    window.SciEngCatalog.load().then(function () {
      var product = window.SciEngCatalog.getById(productId);
      if (!product) return;

      var sku = (params.get('sku') || product.sku || '').trim();
      var variantLabel = '';

      if (params.get('sku') && product.variants && product.variants.length) {
        var wanted = params.get('sku').replace(/\s+/g, '');
        for (var i = 0; i < product.variants.length; i++) {
          var row = product.variants[i];
          var rowSku = String(row.sku || row.product_code || row.set_code || '').replace(/\s+/g, '');
          if (rowSku === wanted) {
            sku = rowSku;
            variantLabel = Object.keys(row)
              .filter(function (k) {
                return k !== 'sr' && k !== 'sku' && k !== 'product_code' && k !== 'set_code';
              })
              .map(function (k) {
                return row[k];
              })
              .filter(Boolean)
              .join(' · ');
            break;
          }
        }
      }

      window.SciEngQuoteCart.addItem({
        productId: product.id,
        sku: sku,
        name: product.name.replace(/^['']|['']$/g, '').trim(),
        variantLabel: variantLabel,
        qty: 1,
      });

      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      renderCart();
      if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
    });
  }

  function renderCart() {
    var listEl = document.getElementById('checkoutCartList');
    var emptyEl = document.getElementById('checkoutCartEmpty');
    var configWarn = document.getElementById('checkoutFormConfigWarn');
    if (!listEl || !window.SciEngQuoteCart) return;

    var items = window.SciEngQuoteCart.read();

    if (!items.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      syncFormMode();
      if (configWarn) configWarn.hidden = formConfigured();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    syncFormMode();

    listEl.innerHTML = items
      .map(function (item) {
        var sku = esc(item.sku || item.productId);
        var name = esc(item.name || item.productId);
        var variant = item.variantLabel
          ? '<span class="checkout-cart-variant">' + esc(item.variantLabel) + '</span>'
          : '';
        return (
          '<div class="checkout-cart-row" data-cart-row="' +
          esc(item.productId) +
          '::' +
          esc(item.sku) +
          '">' +
          '<div class="checkout-cart-info">' +
          '<strong>' +
          name +
          '</strong>' +
          variant +
          '<span class="mono checkout-cart-sku">' +
          sku +
          '</span>' +
          '</div>' +
          '<div class="checkout-cart-actions">' +
          '<label class="checkout-qty-label">Qty' +
          '<input type="number" class="checkout-qty-input" min="1" value="' +
          item.qty +
          '" data-qty-product="' +
          esc(item.productId) +
          '" data-qty-sku="' +
          esc(item.sku) +
          '" />' +
          '</label>' +
          '<button type="button" class="checkout-remove-btn" data-remove-product="' +
          esc(item.productId) +
          '" data-remove-sku="' +
          esc(item.sku) +
          '" aria-label="Remove item">Remove</button>' +
          '</div></div>'
        );
      })
      .join('');

    if (configWarn) configWarn.hidden = formConfigured();
  }

  function bindCartActions() {
    var root = document.getElementById('checkoutPage');
    if (!root) return;

    root.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('[data-remove-product]');
      if (removeBtn && window.SciEngQuoteCart) {
        window.SciEngQuoteCart.removeItem(
          removeBtn.getAttribute('data-remove-product'),
          removeBtn.getAttribute('data-remove-sku')
        );
        renderCart();
        if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
        return;
      }

      var clearBtn = e.target.closest('#checkoutClearCart');
      if (clearBtn && window.SciEngQuoteCart) {
        if (window.confirm('Remove all items from your cart?')) {
          window.SciEngQuoteCart.clear();
          renderCart();
          if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
        }
      }
    });

    root.addEventListener('change', function (e) {
      var input = e.target.closest('.checkout-qty-input');
      if (!input || !window.SciEngQuoteCart) return;
      window.SciEngQuoteCart.updateQty(
        input.getAttribute('data-qty-product'),
        input.getAttribute('data-qty-sku'),
        input.value
      );
      if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
    });
  }

  function showError(msg) {
    var el = document.getElementById('checkoutFormError');
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }

  function validateContact(data, mode) {
    if (!data.fullName) return 'Full name is required.';
    if (!data.email) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Enter a valid email address.';
    if (!data.institute) return 'Institute / Organization is required.';
    if (mode === 'cart' && !window.SciEngQuoteCart.read().length) {
      return 'Your cart is empty. Add products before checkout.';
    }
    if (mode === 'write' && !data.writeMessage) {
      return 'Please enter your message.';
    }
    return '';
  }

  function submitToGoogleForm(data) {
    var cfg = window.SciEngGoogleForm;
    var url = 'https://docs.google.com/forms/d/e/' + cfg.formId + '/formResponse';
    var body = new FormData();

    body.append(cfg.fields.fullName, data.fullName);
    body.append(cfg.fields.email, data.email);
    if (cfg.fields.institute) body.append(cfg.fields.institute, data.institute);
    if (cfg.fields.phone) body.append(cfg.fields.phone, data.phone);
    if (cfg.fields.designation) body.append(cfg.fields.designation, data.designation);
    body.append(cfg.fields.orderItems, data.orderItems);
    if (cfg.fields.notes) body.append(cfg.fields.notes, data.notes);

    return fetch(url, { method: 'POST', mode: 'no-cors', body: body });
  }

  function bindCheckoutForm() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError('');

      var mode = cartHasItems() ? 'cart' : 'write';
      var writeMessage =
        (form.writeMessage && form.writeMessage.value.trim()) || '';
      var data = {
        fullName: (form.fullName && form.fullName.value.trim()) || '',
        email: (form.email && form.email.value.trim()) || '',
        institute: (form.institute && form.institute.value.trim()) || '',
        phone: (form.phone && form.phone.value.trim()) || '',
        designation: (form.designation && form.designation.value.trim()) || '',
        notes: (form.notes && form.notes.value.trim()) || '',
        writeMessage: writeMessage,
        orderItems:
          mode === 'cart'
            ? window.SciEngQuoteCart
              ? window.SciEngQuoteCart.toBomText()
              : ''
            : 'Write to us:\n' + writeMessage,
      };

      if (mode === 'write') {
        data.notes = writeMessage;
      }

      var err = validateContact(data, mode);
      if (err) {
        showError(err);
        return;
      }

      if (!formConfigured()) {
        showError('Google Form is not configured yet. Add your form ID in js/google-form-config.js.');
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
      }

      submitToGoogleForm(data)
        .then(function () {
          if (window.SciEngQuoteCart) window.SciEngQuoteCart.clear();
          var thankYou = (window.SciEngGoogleForm.thankYouPath || 'thank-you.html').replace(/^\//, '');
          window.location.href = base + thankYou;
        })
        .catch(function () {
          showError('Submission failed. Please try again or email info@sciengtech.in.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent =
              mode === 'cart' ? 'Submit Quote Request' : 'Send message';
          }
        });
    });
  }

  function init() {
    mergeQueryProduct();
    renderCart();
    bindCartActions();
    bindCheckoutForm();
    if (window.SciEngCartUI) window.SciEngCartUI.updateBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
