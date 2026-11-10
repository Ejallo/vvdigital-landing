/* =========================================================================
   VVdigital: hero particle network (vanilla port of the "Aether Flow" idea)
   - draws on a transparent canvas behind the hero, colors come from CSS tokens
   - animates on all devices; static single frame only with reduced motion
   - pauses when the hero is off-screen or the tab is hidden
   ========================================================================= */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-hero-net]');
  if (!canvas || !canvas.getContext) return;

  var host = canvas.parentElement;
  var ctx = canvas.getContext('2d');

  var LINK = 140;          // max distance between linked dots, px
  var MOUSE_RADIUS = 200;  // cursor influence, px
  var PUSH = 300;          // cursor push strength, px per second
  var SPEED = 12;          // max dot speed, px per second
  var MAX_DPR = 2;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = [];
  var w = 0;
  var h = 0;
  var mouse = { x: null, y: null };
  var colors = { dot: [185, 179, 162], line: [185, 179, 162], hot: [22, 24, 26] };
  var raf = 0;
  var last = 0;
  var inView = true;

  function hexToRgb(value, fallback) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(value).trim());
    if (!m) return fallback;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors.dot = hexToRgb(cs.getPropertyValue('--ink-3'), colors.dot);
    colors.line = hexToRgb(cs.getPropertyValue('--ink-3'), colors.line);
    colors.hot = hexToRgb(cs.getPropertyValue('--accent'), colors.hot);
  }

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
  }

  function isStatic() {
    return reduced;
  }

  function seed() {
    var count = Math.round((w * h) / 9000);
    count = Math.max(30, Math.min(count, 170));
    dots = [];
    for (var i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() * 2 - 1) * SPEED,
        vy: (Math.random() * 2 - 1) * SPEED,
        r: Math.random() * 1.6 + 1
      });
    }
  }

  function resize() {
    var rect = host.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors();
    seed();
    draw();
    sync();
  }

  function step(dt) {
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < 0 || d.x > w) { d.vx = -d.vx; d.x = Math.max(0, Math.min(w, d.x)); }
      if (d.y < 0 || d.y > h) { d.vy = -d.vy; d.y = Math.max(0, Math.min(h, d.y)); }

      if (mouse.x !== null) {
        var dx = mouse.x - d.x;
        var dy = mouse.y - d.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.01 && dist < MOUSE_RADIUS) {
          var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          d.x -= (dx / dist) * force * PUSH * dt;
          d.y -= (dy / dist) * force * PUSH * dt;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    for (var a = 0; a < dots.length; a++) {
      var p = dots[a];
      for (var b = a + 1; b < dots.length; b++) {
        var q = dots[b];
        var dx = p.x - q.x;
        var dy = p.y - q.y;
        if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > LINK) continue;

        var alpha = 1 - dist / LINK;
        var hot = false;
        if (mouse.x !== null) {
          var mx = p.x - mouse.x;
          var my = p.y - mouse.y;
          hot = mx * mx + my * my < MOUSE_RADIUS * MOUSE_RADIUS;
        }
        ctx.strokeStyle = hot ? rgba(colors.hot, alpha * 0.9) : rgba(colors.line, alpha * 0.42);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = rgba(colors.dot, 0.75);
    for (var i = 0; i < dots.length; i++) {
      ctx.beginPath();
      ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    draw();
  }

  function sync() {
    var run = !isStatic() && inView && !document.hidden;
    if (run && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function clearPointer() {
    mouse.x = null;
    mouse.y = null;
  }

  // touch: a finger on the hero also pushes the dots until it lifts
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') clearPointer(); }, { passive: true });
  window.addEventListener('pointercancel', clearPointer, { passive: true });

  window.addEventListener('pointermove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      mouse.x = null;
      mouse.y = null;
    } else {
      mouse.x = x;
      mouse.y = y;
    }
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  document.addEventListener('visibilitychange', sync);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    }).observe(host);
  }

  if ('ResizeObserver' in window) {
    var timer = 0;
    new ResizeObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(resize, 120);
    }).observe(host);
  } else {
    window.addEventListener('resize', resize);
  }

  // accent can change through the design Tweaks panel
  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      readColors();
      if (!raf) draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-accent'] });
  }

  resize();
})();
