/* VVdigital — интерактив: меню, аккордеоны, форма, tweaks, reveal */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---------------- header burger + drawer ---------------- */
  var drawer = document.querySelector('.drawer');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.setAttribute('data-open', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    root.classList.toggle('no-scroll', open);
    var btn = document.querySelector('.burger[aria-expanded]');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.querySelectorAll('[data-burger]').forEach(function (b) {
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () { setDrawer(true); });
  });
  document.querySelectorAll('[data-drawer-close]').forEach(function (b) {
    b.addEventListener('click', function () { setDrawer(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  /* --- mobile languages: keep UA label as in brief --- */

  /* ---------------- accordions ---------------- */
  document.querySelectorAll('[data-accordion]').forEach(function (group) {
    var single = group.getAttribute('data-accordion') === 'single';
    group.querySelectorAll('[data-acc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('[data-open]');
        if (!item) return;
        var isOpen = item.getAttribute('data-open') === 'true';
        if (single && !isOpen) {
          group.querySelectorAll('[data-open="true"]').forEach(function (other) {
            other.setAttribute('data-open', 'false');
            var b = other.querySelector('[data-acc]');
            if (b) b.setAttribute('aria-expanded', 'false');
          });
        }
        item.setAttribute('data-open', isOpen ? 'false' : 'true');
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------------- form ---------------- */
  var form = document.getElementById('lead-form');
  if (form) {
    var alertBox = document.getElementById('form-alert');
    var alertText = document.getElementById('form-alert-text');
    var success = document.getElementById('form-success');
    var submit = document.getElementById('form-submit');

    function fieldWrap(el) {
      return el.closest('[data-field]') || el.closest('.field');
    }
    function setError(el, on) {
      var w = fieldWrap(el);
      if (!w) return;
      w.classList.toggle('field--error', !!on);
      if (el.setAttribute) el.setAttribute('aria-invalid', on ? 'true' : 'false');
    }
    function validEmailOrTg(v) {
      var s = v.trim();
      if (!s) return false;
      if (/^@[a-zA-Z0-9_]{4,}$/.test(s)) return true;
      if (/^t\.me\//i.test(s)) return true;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return true;
      return /^[+\d][\d\s()\-]{6,}$/.test(s);
    }
    function validate() {
      var bad = [];
      var name = form.querySelector('[name=name]');
      var contact = form.querySelector('[name=contact]');
      var site = form.querySelector('[name=site]');
      var consent = form.querySelector('[name=consent]');
      var consentMsg = document.querySelector('[data-err-consent]');

      setError(name, !name.value.trim());
      if (!name.value.trim()) bad.push('name');

      setError(contact, !validEmailOrTg(contact.value));
      if (!validEmailOrTg(contact.value)) bad.push('contact');

      var siteOk = true;
      if (site.value.trim()) siteOk = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(site.value.trim());
      setError(site, !siteOk);
      if (!siteOk) bad.push('site');

      if (consentMsg) consentMsg.style.display = consent.checked ? 'none' : 'block';
      if (!consent.checked) bad.push('consent');

      return bad;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name=company]').value) return; // honeypot
      var bad = validate();
      if (bad.length) {
        alertText.textContent = bad.length === 1
          ? 'Одно поле нужно поправить.'
          : 'Нужно поправить ' + bad.length + ' поля.';
        alertBox.setAttribute('data-show', 'true');
        var first = form.querySelector('.field--error .input, .field--error .textarea, .field--error .select');
        if (first) first.focus();
        return;
      }
      alertBox.setAttribute('data-show', 'false');

      // Демо-состояние: в продакшене здесь POST на /send.php
      submit.setAttribute('aria-disabled', 'true');
      submit.textContent = 'Отправляем…';
      setTimeout(function () {
        form.setAttribute('data-hidden', 'true');
        success.setAttribute('data-show', 'true');
        var top = success.getBoundingClientRect().top + window.pageYOffset - 140;
        window.scrollTo({ top: top, behavior: 'smooth' });
        try { localStorage.setItem('vv_form_sent', '1'); } catch (err) {}
      }, 620);
    });

    form.querySelectorAll('.input, .textarea, .select, [name=consent]').forEach(function (el) {
      el.addEventListener('input', function () {
        var w = fieldWrap(el);
        if (w && w.classList.contains('field--error')) validate();
      });
      el.addEventListener('change', function () {
        if (el.name === 'consent') {
          var m = document.querySelector('[data-err-consent]');
          if (m) m.style.display = el.checked ? 'none' : 'block';
        }
      });
    });

    var reset = document.querySelector('[data-form-reset]');
    if (reset) reset.addEventListener('click', function () {
      form.reset();
      form.removeAttribute('data-hidden');
      success.setAttribute('data-show', 'false');
      submit.removeAttribute('aria-disabled');
      submit.innerHTML = 'Отправить заявку <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M10 1l5 5-5 5M15 6H1" stroke="currentColor" stroke-width="1.5"/></svg>';
      var m = document.querySelector('[data-err-consent]');
      if (m) m.style.display = 'none';
    });
  }

  /* ---------------- deep-link state for form demo (?state=error|success) ---------------- */
  (function () {
    var p = new URLSearchParams(location.search).get('state');
    if (!form || !p) return;
    if (p === 'error') {
      form.querySelector('[name=name]').value = '';
      form.querySelector('[name=contact]').value = 'почта';
      var ev = new Event('submit', { cancelable: true, bubbles: true });
      form.dispatchEvent(ev);
    }
    if (p === 'success') {
      form.setAttribute('data-hidden', 'true');
      success.setAttribute('data-show', 'true');
    }
  })();

  /* ---------------- TWEAKS ---------------- */
  var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "pair": "unbounded",
    "accent": "graphite",
    "density": "normal",
    "gridlines": "off",
    "grain": "on"
  }/*EDITMODE-END*/;

  var state = Object.assign({}, TWEAK_DEFAULTS);
  var panel = document.getElementById('tweaks');

  function apply() {
    root.setAttribute('data-pair', state.pair);
    root.setAttribute('data-accent', state.accent);
    root.setAttribute('data-density', state.density);
    root.setAttribute('data-gridlines', state.gridlines === 'on' ? 'on' : 'off');
    root.setAttribute('data-grain', state.grain === 'on' ? 'on' : 'off');
    if (panel) {
      panel.querySelectorAll('[data-tw-key]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(state[b.dataset.twKey]) === b.dataset.twVal ? 'true' : 'false');
      });
    }
  }

  function persist(patch) {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
    } catch (e) {}
  }

  // listener first, then announce
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === '__activate_edit_mode') {
      if (panel) panel.setAttribute('data-open', 'true');
    } else if (d.type === '__deactivate_edit_mode') {
      if (panel) panel.setAttribute('data-open', 'false');
    } else if (d.type === '__edit_mode_state' && d.edits) {
      Object.assign(state, d.edits);
      apply();
    }
  });

  if (panel) {
    panel.querySelectorAll('[data-tw-key]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.twKey;
        var v = b.dataset.twVal;
        if (k === 'gridlines' || k === 'grain') {
          // toggle pairs: pressing turns the mode on/off
          v = state[k] === v ? (k === 'gridlines' ? 'off' : 'on') : v;
        }
        state[k] = v;
        apply();
        var patch = {};
        patch[k] = v;
        persist(patch);
      });
    });
    var closeBtn = panel.querySelector('[data-tw-close]');
    if (closeBtn) closeBtn.addEventListener('click', function () { panel.setAttribute('data-open', 'false'); });

    // drag
    var head = panel.querySelector('[data-tw-drag]');
    var drag = null;
    if (head) {
      head.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        var r = panel.getBoundingClientRect();
        drag = { x: e.clientX, y: e.clientY, l: r.left, t: r.top };
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = r.left + 'px';
        panel.style.top = r.top + 'px';
        head.setPointerCapture(e.pointerId);
      });
      head.addEventListener('pointermove', function (e) {
        if (!drag) return;
        panel.style.left = Math.max(6, Math.min(window.innerWidth - panel.offsetWidth - 6, drag.l + e.clientX - drag.x)) + 'px';
        panel.style.top = Math.max(6, Math.min(window.innerHeight - 60, drag.t + e.clientY - drag.y)) + 'px';
      });
      head.addEventListener('pointerup', function () { drag = null; });
    }
  }

  apply();
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

  /* ---------------- smooth in-page nav without scrollIntoView ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      setDrawer(false);
      var y = t.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
