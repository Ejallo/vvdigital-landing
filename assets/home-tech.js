/* =========================================================================
   VVdigital home: hero console (chart, count-up), hero offer form,
   services list + detail card built from the existing .svc articles.
   Without JS the page keeps the static values and the services accordion.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- console chart (illustrative) ---------------- */
  var shapes = {
    7: { v: [60, 58, 66, 70, 74, 82, 88], s: [40, 42, 41, 43, 44, 44, 45] },
    30: { v: [30, 34, 33, 40, 46, 44, 52, 58, 63, 61, 70, 78, 84, 92], s: [28, 30, 31, 32, 33, 34, 35, 36, 36, 37, 38, 39, 40, 41] },
    90: { v: [18, 22, 20, 28, 34, 33, 41, 47, 55, 58, 66, 72, 81, 90, 96], s: [26, 27, 29, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43] }
  };

  function points(arr) {
    var step = 400 / (arr.length - 1);
    return arr.map(function (v, i) { return [i * step, 140 - v * 1.2]; });
  }

  function curve(p) {
    return p.map(function (q, i) {
      if (!i) return 'M' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      var prev = p[i - 1];
      var cx = (prev[0] + q[0]) / 2;
      return 'C' + cx.toFixed(1) + ' ' + prev[1].toFixed(1) + ' ' + cx.toFixed(1) + ' ' + q[1].toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }).join(' ');
  }

  var chart = document.querySelector('.console__chart svg');
  function drawChart(range) {
    if (!chart) return;
    var sh = shapes[range];
    var pv = points(sh.v);
    var ps = points(sh.s);
    var value = chart.querySelector('[data-chart="value"]');
    var spend = chart.querySelector('[data-chart="spend"]');
    value.setAttribute('d', curve(pv));
    spend.setAttribute('d', curve(ps));
    chart.querySelector('[data-chart="area"]').setAttribute('d', curve(pv) + ' L400 150 L0 150 Z');
    var end = pv[pv.length - 1];
    var dot = chart.querySelector('[data-chart="dot"]');
    dot.setAttribute('cx', end[0] - 2);
    dot.setAttribute('cy', end[1]);
    if (!reduced) {
      [value, spend].forEach(function (el) {
        el.classList.remove('is-drawing');
        void el.getBoundingClientRect();
        el.classList.add('is-drawing');
      });
    }
  }
  drawChart(30);
  document.querySelectorAll('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-range]').forEach(function (o) {
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      drawChart(+b.getAttribute('data-range'));
    });
  });

  /* ---------------- count-up (final values are already in the HTML) ---------------- */
  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  if (!reduced) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = +el.getAttribute('data-count');
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      var t0 = performance.now();
      var dur = 1600;
      (function tick(now) {
        var k = Math.min((now - t0) / dur, 1);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + fmt(to * e) + suf;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* ---------------- hero offer: hand over to the main form ---------------- */
  var heroForm = document.querySelector('[data-hero-form]');
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var site = document.getElementById('hx-site');
      var contact = document.getElementById('hx-contact');
      var fSite = document.getElementById('f-site');
      var fContact = document.getElementById('f-contact');
      if (fSite && site && site.value) fSite.value = site.value;
      if (fContact && contact && contact.value) fContact.value = contact.value;
      var target = document.getElementById('contact');
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
      var name = document.getElementById('f-name');
      if (name) setTimeout(function () { name.focus({ preventScroll: true }); }, reduced ? 0 : 600);
    });
  }

  /* ---------------- services: list + detail card ---------------- */
  var box = document.querySelector('[data-svc-tabs]');
  if (!box) return;
  var items = Array.prototype.slice.call(box.querySelectorAll('.svc'));
  if (!items.length) return;

  function text(root, sel) {
    var el = root.querySelector(sel);
    return el ? el.textContent.trim() : '';
  }

  var data = items.map(function (art) {
    var row = art.querySelector('.svc__row');
    var link = art.querySelector('.svc__links a');
    return {
      num: text(art, '.svc__num'),
      name: text(art, '.svc__name'),
      short: text(art, '.svc__desc'),
      price: text(art, '.svc__row .svc__price'),
      body: text(art, '.svc__body p'),
      bullets: Array.prototype.map.call(art.querySelectorAll('.svc__bullets li'), function (li) { return li.textContent.trim(); }),
      meta: text(art, '.svc__meta'),
      result: row ? row.getAttribute('data-result') || '' : '',
      href: link ? link.getAttribute('href') : '#contact'
    };
  });

  var wrap = document.createElement('div');
  wrap.className = 'svx';
  var list = document.createElement('div');
  list.className = 'svx__list';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Услуги');
  var card = document.createElement('article');
  card.className = 'svx__card';
  card.setAttribute('role', 'tabpanel');
  card.id = 'svx-card';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var buttons = data.map(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'svx__item';
    b.id = 'svx-tab-' + i;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'svx-card');
    b.innerHTML = '<span class="svx__n">' + esc(d.num) + '</span><span class="svx__t">' + esc(d.name) + '</span><span class="svx__p">' + esc(d.price) + '</span><span class="svx__a" aria-hidden="true"></span>';
    b.addEventListener('click', function () { show(i, true); });
    b.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowDown' && k !== 'ArrowUp') return;
      e.preventDefault();
      var j = (i + (k === 'ArrowDown' ? 1 : -1) + data.length) % data.length;
      buttons[j].focus();
      show(j, false);
    });
    list.appendChild(b);
    return b;
  });

  function show(i, scroll) {
    var d = data[i];
    buttons.forEach(function (b, j) {
      b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      b.tabIndex = j === i ? 0 : -1;
    });
    card.setAttribute('aria-labelledby', 'svx-tab-' + i);
    var facts = '<div><small>Цена</small><b class="is-hot">' + esc(d.price) + '</b></div>' +
      '<div><small>Условия</small><b>' + esc(d.meta) + '</b></div>' +
      (d.result ? '<div><small>Результат</small><b>' + esc(d.result) + '</b></div>' : '');
    card.innerHTML =
      '<div class="svx__head"><span>' + esc(d.num) + ' / ' + String(data.length).padStart(2, '0') + '</span><span>' + esc(d.short) + '</span></div>' +
      '<h3>' + esc(d.name) + '</h3>' +
      '<p>' + esc(d.body) + '</p>' +
      '<ul class="svx__inc">' + d.bullets.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="svx__facts">' + facts + '</div>' +
      '<a class="btn svx__btn" href="' + esc(d.href) + '">Обсудить: ' + esc(d.name) + '</a>';
    if (!reduced) {
      card.classList.remove('is-in');
      void card.offsetWidth;
      card.classList.add('is-in');
    }
    if (scroll && window.innerWidth < 900) {
      card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  wrap.appendChild(list);
  wrap.appendChild(card);
  box.hidden = true;
  box.parentNode.insertBefore(wrap, box);
  show(0, false);
})();
