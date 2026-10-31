
// Ruta base del sitio (funciona igual desde la raíz y desde /blog/)
var _siteBase = document.currentScript ? document.currentScript.src.replace(/script\.js.*$/, '') : '';
var _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── INYECTOR DINÁMICO DE FILTRO SVG PARA LIQUID GLASSMORPHISM (SCALE="150") ─
(function ensureGlassFilter() {
  if (document.getElementById('glass-distortion-svg')) return;
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'glass-distortion-svg';
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<defs>' +
    '<filter id="glass-distortion" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.006" numOctaves="2" seed="92" result="noise" />' +
      '<feGaussianBlur in="noise" stdDeviation="2" result="blurred" />' +
      '<feDisplacementMap in="SourceGraphic" in2="blurred" scale="45" xChannelSelector="R" yChannelSelector="G" />' +
    '</filter>' +
  '</defs>';
  function insert() {
    if (document.body && !document.getElementById('glass-distortion-svg')) {
      document.body.insertBefore(svg, document.body.firstChild);
    }
  }
  if (document.body) insert();
  else document.addEventListener('DOMContentLoaded', insert);
})();


// ── MODO MANTENIMIENTO GLOBAL ───────────────────────────────────────────────
(function() {
  'use strict';
  var style = document.createElement('style');
  style.textContent = '#site-maintenance-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:1.5rem;background:radial-gradient(circle at 50% 0%,rgba(30,45,74,.96),rgba(14,19,32,.99) 68%);color:#edf2fc;text-align:center;opacity:0;animation:site-maintenance-in .6s ease forwards}#site-maintenance-gate .maintenance-card{width:min(680px,100%);padding:clamp(2.5rem,8vw,5rem) 2rem;border:1px solid rgba(184,223,245,.24);border-radius:16px;background:rgba(22,32,51,.66);box-shadow:0 30px 100px rgba(0,0,0,.35)}#site-maintenance-gate .maintenance-mark{width:52px;height:52px;margin:0 auto 1.5rem;border:1px solid rgba(184,223,245,.55);border-radius:50%;display:grid;place-items:center;color:#b8dff5;animation:site-maintenance-spin 8s linear infinite}#site-maintenance-gate svg{width:24px;height:24px}#site-maintenance-gate h1{margin:0 0 .8rem;font:400 clamp(2.5rem,7vw,4.6rem)/1.02 "Cormorant Garamond",Georgia,serif}#site-maintenance-gate p{max-width:480px;margin:0 auto;color:#9bb0d6;font:400 1rem/1.8 "DM Sans",system-ui,sans-serif}body.site-maintenance-active>*:not(#site-maintenance-gate){visibility:hidden}@keyframes site-maintenance-in{to{opacity:1}}@keyframes site-maintenance-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);

  function showMaintenance() {
    if (document.getElementById('site-maintenance-gate')) return;
    var gate = document.createElement('div');
    gate.id = 'site-maintenance-gate';
    gate.setAttribute('role', 'alert');
    gate.innerHTML = '<div class="maintenance-card"><div class="maintenance-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="3"/></svg></div><h1>Volveremos pronto</h1><p>Estamos realizando unos ajustes en la web. Gracias por tu paciencia; estaremos de vuelta en breve.</p></div>';
    document.body.appendChild(gate);
    Array.prototype.slice.call(document.body.children).forEach(function(child) {
      if (child !== gate) child.remove();
    });
    document.body.classList.add('site-maintenance-active');
    document.body.style.overflow = 'hidden';
  }

  fetch('/mantenimiento-config.js?v=' + Date.now(), { cache: 'no-store' })
    .then(function(response) { return response.ok ? response.text() : ''; })
    .then(function(source) {
      var match = source.match(/window\.MANTENIMIENTO\s*=\s*(\{.*?\})\s*;/);
      if (match && JSON.parse(match[1]).activo === true) showMaintenance();
    })
    .catch(function() {});
})();

// ════════════════════════════════════════════════════════════════════════════
// SEGURIDAD Y RGPD
//
// Fuentes y librerías se sirven desde este dominio (fonts/ y vendor/): cargar
// una página no contacta con terceros y la CSP de cada <head> solo permite
// scripts propios. Por eso no se admiten <script> ni on* en línea.
//
// La web está en GitHub Pages, que no permite cabeceras HTTP propias. La CSP va
// en <meta>; X-Frame-Options, frame-ancestors y HSTS requerirían un proxy
// delante (p. ej. Cloudflare) porque no funcionan desde el HTML.
// ════════════════════════════════════════════════════════════════════════════

// ── Fallback sin animaciones (se aplica si el usuario rechaza o aún no decide)
function applyNoAnimationFallback() {
  document.querySelectorAll('.reveal, .hero-eyebrow, .hero-title .line, .hero-desc, .hero-actions, .hero-scroll-hint').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.benefit-reveal').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

// ── Inicializar animaciones GSAP + efectos interactivos avanzados ────────────
function initAnimations() {
  if (typeof gsap === 'undefined' || _reducedMotion) { applyNoAnimationFallback(); return; }
  var isMobileDevice = window.innerWidth <= 768;
  gsap.registerPlugin(ScrollTrigger);

  // ── Nav entrada ──────────────────────────────────────────────────────────────
  gsap.from('#main-nav', { y: -80, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' });

  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: (self) => {
      var mainNav = document.querySelector('#main-nav');
      if (mainNav) {
        mainNav.style.borderBottomColor =
          self.progress > 0 ? 'rgba(30,48,64,0.22)' : 'rgba(30,48,64,0.12)';
      }
    }
  });

  // ── Hero timeline (activo al entrar y al volver a subir) ────────────────────
  if (document.querySelector('.hero')) {
    const heroTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: {
        trigger: '.hero',
        start: 'top 85%',
        end: 'bottom 15%',
        toggleActions: isMobileDevice ? 'play none none reset' : 'play reverse play reverse'
      }
    });
    heroTl
      .fromTo('.hero-eyebrow', { opacity: 0 }, { opacity: 1, duration: 0.6 })
      .fromTo('.hero-eyebrow-line', { width: 0 }, { width: 32, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .fromTo('.hero-title .line', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power4.out' }, '-=0.2')
      .fromTo('.hero-desc', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
      .fromTo('.hero-actions', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
  }

  // ── Blob morphing continuo ───────────────────────────────────────────────────
  const blobPath = document.querySelector('#fx-blob path');
  if (blobPath) {
    const blobs = [
      'M44.3,-67.1C56.9,-61.2,66.3,-48.5,72.4,-34.1C78.5,-19.8,81.2,-3.8,78.1,10.8C75,25.4,66,38.6,54.5,48.5C43,58.4,29,65,13.8,69.2C-1.4,73.3,-17.8,74.9,-32.6,70.1C-47.4,65.4,-60.6,54.3,-68.1,40.1C-75.7,25.9,-77.5,8.6,-74.4,-7.3C-71.3,-23.2,-63.2,-37.8,-51.9,-47.7C-40.5,-57.6,-25.8,-62.8,-10.4,-64.6C4.9,-66.4,31.7,-73,44.3,-67.1Z',
      'M38.9,-58.3C52.7,-53.2,67.5,-46.3,73.8,-34.8C80.1,-23.3,77.9,-7.2,73.5,7.4C69.1,22,62.4,35,52.1,44.3C41.8,53.6,27.8,59.2,13,64.2C-1.8,69.2,-17.4,73.6,-31.4,69.7C-45.4,65.8,-57.7,53.6,-65.3,39.1C-72.9,24.6,-75.8,7.8,-72.6,-7.5C-69.4,-22.8,-60.1,-36.5,-48.1,-41.5C-36.1,-46.5,-21.3,-42.8,-8.2,-52.6C4.9,-62.4,25.1,-63.4,38.9,-58.3Z',
      'M51.6,-74.5C64.8,-68.2,72.6,-52.5,77.4,-36.4C82.2,-20.2,83.9,-3.6,79.8,11.3C75.7,26.2,65.8,39.5,53.8,49.8C41.8,60.1,27.7,67.4,12.4,70.6C-2.9,73.8,-19.4,72.9,-34.8,67.1C-50.2,61.3,-64.5,50.6,-71.4,36.4C-78.2,22.2,-77.5,4.5,-72.8,-11C-68.1,-26.5,-59.3,-39.8,-47.5,-46.5C-35.7,-53.2,-20.9,-53.3,-4.9,-47C11.1,-40.7,38.4,-80.8,51.6,-74.5Z'
    ];
    let bi = 0;
    function morphBlob() {
      bi = (bi + 1) % blobs.length;
      gsap.to(blobPath, {
        attr: { d: blobs[bi] },
        duration: 6, ease: 'power1.inOut',
        onComplete: morphBlob
      });
    }
    gsap.to('#fx-blob', { opacity: 0.55, duration: 1.2, delay: 0.5 });
    morphBlob();

    // Parallax leve del blob al scroll
    gsap.to('#fx-blob', {
      y: 120, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  // ── Canvas de partículas flotantes ───────────────────────────────────────────
  (function() {
    var canvas = document.getElementById('fx-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = document.querySelector('.hero');
    var W, H, pts;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Leer el color de partículas desde la paleta CSS para mantener coherencia visual
    var particleColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--sage').trim() || '58,91,120';
    // Convertir hex a rgb si es necesario (--sage suele ser hex)
    function hexToRgb(hex) {
      var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/\s/g,''));
      return r ? parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16) : null;
    }
    var ptRgb = hexToRgb(particleColor) || '80,110,90';

    var N = Math.min(55, Math.floor(W / 22));
    pts = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      a: 0.3 + Math.random() * 0.5
    }));

    var mx = W / 2, my = H / 2;
    function onMouseMove(e) {
      var rect = hero.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    }
    hero.addEventListener('mousemove', onMouseMove);

    var raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // Conexiones entre puntos cercanos
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(30,48,64,' + (0.06 * (1 - dist/120)) + ')';
            ctx.lineWidth = 0.8;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        // Atracción suave hacia cursor
        var ddx = mx - pts[i].x, ddy = my - pts[i].y;
        var dd = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 180) {
          pts[i].vx += ddx / dd * 0.012;
          pts[i].vy += ddy / dd * 0.012;
        }
        pts[i].vx *= 0.98; pts[i].vy *= 0.98;
        pts[i].x += pts[i].vx; pts[i].y += pts[i].vy;
        if (pts[i].x < 0) pts[i].x = W;
        if (pts[i].x > W) pts[i].x = 0;
        if (pts[i].y < 0) pts[i].y = H;
        if (pts[i].y > H) pts[i].y = 0;

        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + ptRgb + ',' + pts[i].a + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    // Pausar cuando el hero no es visible (perf)
    var io = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { if (!raf) draw(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
    io.observe(hero);
    // Limpiar listener si el canvas se destruye (p.ej. rechazar cookies antes de initAnimations)
    window.addEventListener('pagehide', function() {
      hero.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
      raf = null;
    }, { once: true });
  })();

  // ── Stats pop-in (siempre activo al hacer scroll) ────────────────────────────
  document.querySelectorAll('.stat').forEach(stat => {
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 90%',
      end: 'bottom top',
      toggleActions: isMobileDevice ? 'play none none reset' : 'play reverse play reverse',
      animation: gsap.fromTo(stat,
        { scale: 0.85, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
      )
    });
  });

  // ── Reveal genérico (siempre activo al subir y bajar en scroll) ──────────────
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  // ── Animación universal de tarjetas Liquid Glass con ScrollTrigger ─────────
  var cardSelectors = '.stat, .pillar, .service-card, .taller-card, .benefit-card, .contact-card, .landing-card, .blog-card, .payment-card, .reviews-hero-box, .faq-inner';
  document.querySelectorAll(cardSelectors).forEach(function(card) {
    if (!card.classList.contains('reveal')) {
      gsap.fromTo(card,
        { opacity: 0, y: isMobileDevice ? 20 : 24 },
        {
          opacity: 1, y: 0, duration: isMobileDevice ? 0.5 : 0.7, ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'bottom top',
            toggleActions: isMobileDevice ? 'play none none reset' : 'play reverse play reverse'
          }
        }
      );
    }
  });


  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: isMobileDevice ? 18 : 28 },
      {
        opacity: 1, y: 0, duration: isMobileDevice ? 0.5 : 0.75, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          end: 'bottom 10%',
          toggleActions: isMobileDevice ? 'play none none reset' : 'play reverse play reverse'
        }
      }
    );
  });

  // ── Animación escalonada de benefit cards al hacer scroll ────────────────────
  (function() {
    var cards = Array.from(document.querySelectorAll('.benefit-reveal'));
    if (!cards.length) return;

    cards.forEach(function(card) {
      gsap.fromTo(card,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.65, ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            end: 'bottom top',
            toggleActions: isMobileDevice ? 'play none none reset' : 'play reverse play reverse'
          }
        }
      );
    });
  })();
  var isMobile = window.matchMedia('(hover: none)').matches;
  if (!isMobile) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width  - 0.5; // -0.5..0.5
        var ny = (e.clientY - r.top)  / r.height - 0.5;
        var MAX = 12;
        gsap.to(card, {
          rotateY: nx * MAX * 2,
          rotateX: -ny * MAX,
          transformPerspective: 900,
          ease: 'power2.out', duration: 0.4
        });
        var shine = card.querySelector('.tilt-shine');
        if (shine) {
          shine.style.background = 'radial-gradient(circle at '
            + ((nx + 0.5) * 100) + '% ' + ((ny + 0.5) * 100) + '%,'
            + ' rgba(255,255,255,0.18) 0%, transparent 65%)';
        }
      });
      card.addEventListener('mouseleave', function() {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' });
      });
    });
  }

  // ── Efecto magnético en botones CTA ──────────────────────────────────────────
  if (!isMobile) {
    document.querySelectorAll('.mag-btn').forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width  / 2;
        var cy = r.top  + r.height / 2;
        var dx = (e.clientX - cx) * 0.38;
        var dy = (e.clientY - cy) * 0.38;
        gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function() {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  // ── Fade-in suave en títulos de sección ──────────────────────────────────────
  // section-title also has .reveal so it's already handled by the reveal loop above

  // ── Cursor personalizado ──────────────────────────────────────────────────────
  var isTouchOrMobile = window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth <= 1024;
  if (!isTouchOrMobile) {
    var cur  = document.getElementById('fx-cursor');
    var ring = document.getElementById('fx-cursor-ring');
    if (cur && ring) {
      var cx = -100, cy = -100;
      var rx = -100, ry = -100;
      var cursorVisible = false;

      document.addEventListener('mousemove', function(e) {
        cx = e.clientX; cy = e.clientY;
        if (!cursorVisible) {
          cursorVisible = true;
          rx = cx; ry = cy;
          cur.style.opacity = '1';
          ring.style.opacity = '1';
        }
        gsap.to(cur, { left: cx, top: cy, duration: 0.08, ease: 'none' });
      });

      document.addEventListener('mouseleave', function() {
        cursorVisible = false;
        cur.style.opacity = '0';
        ring.style.opacity = '0';
      });

      // Ring sigue con lag suave
      (function ringLoop() {
        if (cursorVisible) {
          rx += (cx - rx) * 0.12;
          ry += (cy - ry) * 0.12;
          ring.style.left = rx + 'px';
          ring.style.top  = ry + 'px';
        }
        requestAnimationFrame(ringLoop);
      })();

      // Hover state en links/botones
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', () => { cur.classList.add('hovering'); ring.classList.add('hovering'); });
        el.addEventListener('mouseleave', () => { cur.classList.remove('hovering'); ring.classList.remove('hovering'); });
      });
      document.addEventListener('mousedown', () => cur.classList.add('clicking'));
      document.addEventListener('mouseup',   () => cur.classList.remove('clicking'));
    }
  }

  // ── Parallax en secciones eliminado: mover secciones enteras con yPercent
  // provoca superposición de contenido y CLS elevado (Core Web Vitals).
  // El parallax se mantiene solo en elementos decorativos sin contenido
  // (blob) donde el impacto en CLS es nulo.
}

// Iniciar animaciones inmediatamente (GSAP se carga antes que este archivo)
initAnimations();

// ── COOKIE CONSENT (AEPD-compliant: granular config panel para Analytics) ────
(function() {
  var banner      = document.getElementById('cookie-banner');
  var configPanel = document.getElementById('cookie-config-panel');
  var consent     = localStorage.getItem('cookie_consent');

  // Limpiar valores inválidos o de versión anterior
  if (consent !== null && consent !== 'accepted' && consent !== 'rejected' && consent !== 'custom') {
    localStorage.removeItem('cookie_consent');
    consent = null;
  }

  function hideBanner() { if (banner) banner.classList.add('hidden'); }
  function showBanner() { if (banner) banner.classList.remove('hidden'); }
  function hidePanel()  { if (configPanel) configPanel.style.display = 'none'; }
  function showPanel()  {
    var analyticsAllowed = localStorage.getItem('cookie_analytics') === '1';
    var toggle = document.getElementById('cookie-analytics-toggle');
    if (toggle) toggle.checked = analyticsAllowed;
    if (configPanel) {
      configPanel.style.display = 'flex';
      configPanel.focus && configPanel.focus();
    }
  }

  function loadAnalytics() {
    // ── Google Analytics — PENDIENTE DE CONFIGURAR ──────────────────────────
    // Sustituye G-XXXXXXXXXX por tu ID real de medición antes de activar.
  }

  if (consent === 'accepted') {
    hideBanner();
    localStorage.setItem('cookie_analytics', '1');
    loadAnalytics();
  } else if (consent === 'rejected') {
    hideBanner();
  } else if (consent === 'custom') {
    hideBanner();
    if (localStorage.getItem('cookie_analytics') === '1') loadAnalytics();
  } else {
    showBanner();
  }

  // Aceptar todas
  var btnAccept = document.getElementById('cookie-accept');
  if (btnAccept) {
    btnAccept.addEventListener('click', function() {
      localStorage.setItem('cookie_consent', 'accepted');
      localStorage.setItem('cookie_analytics', '1');
      hideBanner();
      loadAnalytics();
    });
  }

  // Solo esenciales
  var btnReject = document.getElementById('cookie-reject');
  if (btnReject) {
    btnReject.addEventListener('click', function() {
      localStorage.setItem('cookie_consent', 'rejected');
      localStorage.setItem('cookie_analytics', '0');
      hideBanner();
    });
  }

  // Abrir panel de configuración
  var btnConfig = document.getElementById('cookie-config');
  if (btnConfig) {
    btnConfig.addEventListener('click', function() {
      showPanel();
    });
  }

  // Guardar preferencias desde panel
  var saveBtn = document.getElementById('cookie-config-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var analyticsOn = document.getElementById('cookie-analytics-toggle').checked;
      localStorage.setItem('cookie_consent', 'custom');
      localStorage.setItem('cookie_analytics', analyticsOn ? '1' : '0');
      hidePanel();
      hideBanner();
      if (analyticsOn) loadAnalytics();
    });
  }

  // Cancelar panel
  var cancelBtn = document.getElementById('cookie-config-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      hidePanel();
    });
  }

  // Botón "Gestionar cookies" en el pie
  var settingsBtn = document.getElementById('cookie-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showPanel();
    });
  }
})();

// ── CONSENTIMIENTO DATOS DE SALUD (art. 9 RGPD) ─────────────────────────────
// Los botones arrancan sin clase disabled — JS los deshabilita al cargarse.
// Así, si JS no está disponible, los botones son accesibles directamente.
(function() {
  var btns = document.querySelectorAll('.contact-btn');
  var hint = document.getElementById('consent-hint');
  var check = document.getElementById('health-consent-check');
  btns.forEach(function(btn) {
    btn.classList.add('disabled-contact');
    btn.addEventListener('click', checkConsent);
  });
  if (hint) hint.classList.remove('hidden');
  if (check) check.addEventListener('change', toggleContactButtons);
})();

function toggleContactButtons() {
  var checked  = document.getElementById('health-consent-check').checked;
  var btns     = document.querySelectorAll('.contact-btn');
  var hint     = document.getElementById('consent-hint');

  btns.forEach(function(btn) {
    if (checked) {
      btn.classList.remove('disabled-contact');
      btn.style.pointerEvents = '';
    } else {
      btn.classList.add('disabled-contact');
    }
  });

  if (hint) hint.classList.toggle('hidden', checked);
}

function checkConsent(e) {
  var checked = document.getElementById('health-consent-check') &&
                document.getElementById('health-consent-check').checked;
  if (!checked) {
    e.preventDefault();
    // Resaltar visualmente el checkbox para orientar al usuario
    var label = document.getElementById('health-consent-label');
    if (label) {
      label.style.borderColor = '#e05050';
      label.style.background  = 'rgba(224,80,80,0.08)';
      setTimeout(function() {
        label.style.borderColor = '';
        label.style.background  = '';
      }, 1800);
    }
    document.getElementById('health-consent-box').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

// ── NAVEGACIÓN PÁGINAS LEGALES ───────────────────────────────────────────────
//
// PROBLEMA ORIGINAL: history.pushState({ legal: page }, '', '#aviso') colisiona
// con los enlaces ancla nativos (#contacto, #servicios…). Cuando el usuario pulsa
// "atrás", el evento popstate se dispara para TODOS los cambios de URL —incluidos
// los de anclas—, lo que provocaba que el handler intentase abrir/cerrar páginas
// legales en momentos incorrectos y congelaba la navegación normal.
//
// SOLUCIÓN: eliminar pushState/popstate por completo para la gestión de legales.
// Las páginas legales son overlays de UI, no rutas reales. El botón nativo "atrás"
// no debe interferir con ellas. En su lugar:
//   · showLegalPage  →  abre el overlay y guarda el scroll, sin tocar el historial.
//   · hideLegalPage  →  cierra el overlay y restaura el scroll, sin pushState.
//   · El título del documento se actualiza para feedback visual, pero la URL no cambia.
//   · Si alguien llega con #aviso/#privacidad/#cookies en la URL (enlace externo,
//     marcador), el bloque de inicialización lo detecta y abre el overlay correcto.
//
var _legalScrollPos = 0;
var _legalTrigger   = null;
var _pageTitle      = document.title;
var _LEGAL_MAP      = { aviso: 'legal-aviso', privacidad: 'legal-privacidad', cookies: 'legal-cookies' };
var _LEGAL_TITLES   = { aviso: 'Aviso Legal', privacidad: 'Política de Privacidad', cookies: 'Política de Cookies' };

function _closeAllLegal() {
  document.querySelectorAll('.legal-page').forEach(function(p) {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });
}

function showLegalPage(page) {
  var id = _LEGAL_MAP[page];
  if (!id) return;

  var el = document.getElementById(id);
  if (el) {
    _legalScrollPos = window.scrollY;
    document.body.style.overflow = 'hidden';
    _closeAllLegal();
    el.classList.add('active');
    el.setAttribute('aria-hidden', 'false');
    el.scrollTop = 0;
    document.title = _LEGAL_TITLES[page] + ' · Eva Vidal Nutrición';
    _legalTrigger = document.activeElement;
    var closeBtn = el.querySelector('.legal-close');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  } else {
    var prefix = window.location.pathname.includes('/blog/') ? '../' : '';
    if (page === 'aviso') window.location.href = prefix + 'aviso-legal.html';
    else if (page === 'privacidad') window.location.href = prefix + 'politica-privacidad.html';
    else if (page === 'cookies') window.location.href = prefix + 'politica-cookies.html';
  }
}

function hideLegalPage() {
  _closeAllLegal();
  document.body.style.overflow = '';
  document.title = _pageTitle;
  // Sin pushState: simplemente cerramos el overlay.
  window.scrollTo({ top: _legalScrollPos, behavior: 'instant' });
  if (_legalTrigger && _legalTrigger.focus) _legalTrigger.focus({ preventScroll: true });
  _legalTrigger = null;
}

// Acciones declaradas con data-* en el HTML (la CSP bloquea los on* en línea)
document.addEventListener('click', function(e) {
  if (!e.target.closest) return;
  var legal = e.target.closest('[data-legal]');
  if (legal) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    showLegalPage(legal.getAttribute('data-legal'));
    return;
  }
  if (e.target.closest('[data-legal-close]')) { hideLegalPage(); return; }
  var tab = e.target.closest('[data-svc-tab]');
  if (tab) { svcTab(parseInt(tab.getAttribute('data-svc-tab'), 10)); return; }
  var move = e.target.closest('[data-c3d-move]');
  if (move) { c3dMove(parseInt(move.getAttribute('data-c3d-move'), 10)); return; }
  var dot = e.target.closest('[data-c3d-goto]');
  if (dot) c3dGoTo(parseInt(dot.getAttribute('data-c3d-goto'), 10));
});

// Soporte para llegada directa con hash en la URL
// (p.ej. enlace desde email: miweb.es/#privacidad)
(function() {
  var hash = window.location.hash.replace('#', '');
  if (_LEGAL_MAP[hash]) showLegalPage(hash);
})();

// Cerrar overlays con Escape — manejador único para evitar doble disparo
// Prioridad: panel cookies > páginas legales (overlay superior) > drawer móvil
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var configPanel = document.getElementById('cookie-config-panel');
  if (configPanel && configPanel.style.display === 'flex') { configPanel.style.display = 'none'; return; }
  var anyLegal = document.querySelector('.legal-page.active');
  if (anyLegal) { hideLegalPage(); return; }
  var drawer = document.getElementById('nav-drawer');
  if (drawer && drawer.classList.contains('open')) {
    var btn = document.getElementById('nav-hamburger');
    if (btn) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
      if (!document.querySelector('.legal-page.active')) document.body.style.overflow = '';
      btn.focus();
    }
  }
});

// ── MENÚ HAMBURGUESA ─────────────────────────────────────────────────────────
(function() {
  var btn    = document.getElementById('nav-hamburger');
  var drawer = document.getElementById('nav-drawer');
  if (!btn || !drawer) return;

  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return Array.from(drawer.querySelectorAll(FOCUSABLE));
  }

  function trapFocus(e) {
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
  }

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.removeAttribute('inert');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
    drawer.addEventListener('keydown', trapFocus);
    // Foco al primer elemento tras completar la transición de entrada
    var first = getFocusable()[0];
    if (first) setTimeout(function() { first.focus(); }, 50);
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    drawer.removeEventListener('keydown', trapFocus);
    // Solo restaurar scroll si no hay página legal abierta
    if (!document.querySelector('.legal-page.active')) {
      document.body.style.overflow = '';
    }
    btn.focus();
  }

  btn.addEventListener('click', function() {
    btn.getAttribute('aria-expanded') === 'true' ? closeDrawer() : openDrawer();
  });

  // Cerrar al hacer clic en un enlace del drawer
  drawer.querySelectorAll('.drawer-link').forEach(function(link) {
    link.addEventListener('click', closeDrawer);
  });

  // Cerrar si se redimensiona a escritorio
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1024 && btn.getAttribute('aria-expanded') === 'true') {
      closeDrawer();
    }
  });
})();


// ── SERVICES TABS (TRANSICIONES SMOOTH Y LIMPIAS) ───────────────────────────
function svcTab(idx) {
  var tabs = document.querySelectorAll('.svc-tab');
  var panels = document.querySelectorAll('.svc-panel');
  if (!panels.length || !panels[idx]) return;

  tabs.forEach(function(t, i) {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });

  panels.forEach(function(p, i) {
    if (i === idx) {
      p.style.display = 'block';
      p.classList.add('active');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(p,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }
        );
      } else {
        p.style.opacity = '1';
        p.style.transform = 'none';
      }
    } else {
      p.classList.remove('active');
      p.style.display = 'none';
    }
  });

  var hint = document.querySelector('.svc-hint');
  if (hint) hint.style.display = 'none';
}
// El primer tab ya está activo por defecto — ocultar el hint desde el inicio
(function() {
  var hint = document.querySelector('.svc-hint');
  if (hint) hint.style.display = 'none';
})();

// ── FAQ ACCORDION ────────────────────────────────────────────────────────────
(function() {
  document.querySelectorAll('.faq-q').forEach(function(btn) {
    var answer = btn.nextElementSibling;
    if (answer) {
      var answerId = 'faq-a-' + Math.random().toString(36).slice(2, 7);
      answer.id = answerId;
      btn.setAttribute('aria-controls', answerId);
    }
    btn.addEventListener('click', function() {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-q').forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
        var a = document.getElementById(b.getAttribute('aria-controls'));
        if (a) a.classList.remove('open');
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        var a = document.getElementById(btn.getAttribute('aria-controls'));
        if (a) a.classList.add('open');
      }
    });
  });
})();

// ── STAT COUNTERS ────────────────────────────────────────────────────────────
(function() {
  var counters = document.querySelectorAll('.count-num');
  if (!counters.length || _reducedMotion) return;

  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || '';
    if (target === 0) return; // ya muestra 0
    var start = 0;
    var duration = 1800;
    var startTime = null;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var val = Math.round(easeOut(progress) * target);
      el.textContent = val + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Trigger when stats section enters viewport
  var triggered = false;
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      counters.forEach(function(el) { animateCounter(el); });
    }
  }, { threshold: 0.4 });

  var statsWrap = document.querySelector('.about-stats');
  if (statsWrap) observer.observe(statsWrap);
})();


// ── CARRUSEL 3D ──────────────────────────────────────────────────────────────
(function() {
  var cards = Array.from(document.querySelectorAll('.c3d-card'));
  var dots  = Array.from(document.querySelectorAll('.c3d-dot'));
  var n     = cards.length;
  if (!n) return;
  var cur   = 0;
  var autoTimer;

  // Offsets: posición, rotY, escala, opacidad para cada slot relativo al activo
  var slots = [
    { x: 0,    z: 0,    ry: 0,   s: 1,    o: 1   },   // centro (activo)
    { x: 300,  z: -120, ry: -25, s: 0.85, o: 0.6 },   // derecha
    { x: 0,    z: -300, ry: 0,   s: 0.5,  o: 0.1 },   // atrás (oculto)
    { x: -300, z: -120, ry: 25,  s: 0.85, o: 0.6 }    // izquierda
  ];

  function getSlot(cardIdx) {
    var diff = ((cardIdx - cur) % n + n) % n;
    // Slot 0 = activo, 1 = derecha inmediata, n-1 = izquierda inmediata, resto atrás
    if (diff === 0) return slots[0];
    if (diff === 1) return slots[1];
    if (diff === n - 1) return slots[3];
    return slots[2];
  }

  function render() {
    var isMobile = window.innerWidth <= 768;
    cards.forEach(function(card, i) {
      var sl = getSlot(i);
      card.style.transform = 'translateX(' + (isMobile ? sl.x * 0.22 : sl.x) + 'px) translateZ(' + sl.z + 'px) rotateY(' + sl.ry + 'deg) scale(' + sl.s + ')';
      card.style.opacity   = sl.o;
      card.style.zIndex    = (i === cur) ? 10 : (sl.z === slots[1].z || sl.z === slots[3].z) ? 5 : 1;
      card.classList.toggle('c3d-active', i === cur);
    });
    dots.forEach(function(d, i) { d.classList.toggle('active', i === cur); });
  }

  window.c3dMove = function(dir) {
    cur = ((cur + dir) % n + n) % n;
    render();
    resetAuto();
  };
  window.c3dGoTo = function(idx) {
    cur = idx;
    render();
    resetAuto();
  };

  function resetAuto() {
    clearInterval(autoTimer);
    if (_reducedMotion) return;
    autoTimer = setInterval(function() { c3dMove(1); }, 4200);
  }

  // Swipe táctil
  var touchX = null;
  var scene = document.getElementById('carousel3d');
  if (scene) {
    scene.addEventListener('touchstart', function(e) { touchX = e.touches[0].clientX; }, { passive: true });
    scene.addEventListener('touchend', function(e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) c3dMove(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  render();
  resetAuto();

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) { clearInterval(autoTimer); autoTimer = null; }
    else if (!autoTimer) resetAuto();
  });
})();

// ── NAV SCROLL COMPACT ───────────────────────────────────────────────────────
(function() {
  var nav = document.getElementById('main-nav');
  if (!nav) return;
  var THRESHOLD = 50;

  function update() {
    nav.classList.toggle('nav-scrolled', window.scrollY > THRESHOLD);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


// ══════════════════════════════════════════
// ANIMATIONS & EFFECTS
// ══════════════════════════════════════════

// ── ENLACES EXTERNOS ─────────────────────────────────────────────────────────
document.querySelectorAll('a[target="_blank"]').forEach(function(a) {
  a.setAttribute('rel', 'noopener noreferrer');
});


// SMOOTH PAGE TRANSITIONS
// Al volver con el botón Atrás el navegador restaura la página tal como quedó
// (con el fundido de salida aplicado) si no se retira la clase.
window.addEventListener('pageshow', function() {
    document.body.classList.remove('page-exiting');
});

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('#main-nav a, .blog-back-btn, .footer-col-links a').forEach(a => {
        a.addEventListener('click', function(e) {
            // Only transition for internal html links (not hash anchors)
            var href = a.getAttribute('href') || '';
            if (href.startsWith('#') || href.indexOf('#') === 0) return;
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
            if (a.hostname === window.location.hostname && a.pathname !== window.location.pathname && !a.target) {
                e.preventDefault();
                document.body.classList.add("page-exiting");
                setTimeout(() => { window.location.href = a.href; }, 350);
            }
        });
    });

    // Drawer links: close drawer first, then navigate with transition
    document.querySelectorAll('.nav-drawer a').forEach(a => {
        a.addEventListener('click', function(e) {
            var href = a.getAttribute('href') || '';
            if (href.startsWith('#')) return;
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            var drawer = document.getElementById('nav-drawer');
            var btn = document.getElementById('nav-hamburger');
            if (drawer && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                drawer.setAttribute('aria-hidden', 'true');
                drawer.setAttribute('inert', '');
                if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menú'); }
                document.body.style.overflow = '';
            }
            document.body.classList.add("page-exiting");
            setTimeout(() => { window.location.href = a.href; }, 300);
        });
    });
});


// ── SMOOTH SCROLL MOBILE ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            var target = href.length > 1 ? document.querySelector(href) : null;
            if (target) {
                e.preventDefault();
                var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 54;
                var y = target.getBoundingClientRect().top + window.pageYOffset - navH - 20;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });
});

// ── EXPERIENCIA 3D (SOLO ESCRITORIO) ─────────────────────────────────────────
// Three.js y las partículas superan 1 MB: en móvil no se usan, y solo la portada
// necesita las partículas del logo. No se carga tampoco en mantenimiento.
(function() {
  if (window.innerWidth <= 768 || _reducedMotion) return;
  if (window.MANTENIMIENTO && window.MANTENIMIENTO.activo) return;
  var queue = ['vendor/three.min.js', 'vendor/lenis.min.js'];
  if (document.getElementById('inicio')) queue.push('ev_particles_data.js');
  queue.push('spatial-3d.js');

  function loadNext() {
    if (!queue.length) return;
    var script = document.createElement('script');
    script.src = _siteBase + queue.shift();
    script.onload = loadNext;
    document.body.appendChild(script);
  }

  window.addEventListener('load', loadNext, { once: true });
})();
