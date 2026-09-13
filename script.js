
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


// --- PANEL PRIVADO CREADOR ---
(function() {
  var root = document.getElementById('creator-admin');
  if (!root) return;
  var STORAGE_PIN = 'creator_admin_pin_hash_v1';
  var STORAGE_CONTENT = 'creator_admin_content_v1';
  var STORAGE_LEADS = 'creator_admin_leads_v1';
  var logged = sessionStorage.getItem('creator_admin_unlocked') === '1';
  var login = document.getElementById('creator-admin-login');
  var shell = document.getElementById('creator-admin-shell');
  var pinInput = document.getElementById('creator-admin-pin');
  var loginCopy = document.getElementById('creator-admin-login-copy');
  var loginStatus = document.getElementById('creator-admin-login-status');
  var contentFields = [
    { key: 'heroDesc', label: 'Texto principal de bienvenida', selector: '.hero-desc', type: 'textarea' },
    { key: 'ctaSub', label: 'Texto de llamada final', selector: '.cta-sub', type: 'textarea' },
    { key: 'priceFirst', label: 'Precio primera consulta', selector: '#svc-panel-0 .svc-panel-price', type: 'text' },
    { key: 'pricePack', label: 'Precio pack consulta + seguimiento', selector: '#svc-panel-1 .svc-panel-price', type: 'text' },
    { key: 'priceFollow', label: 'Precio seguimiento', selector: '#svc-panel-2 .svc-panel-price', type: 'text' },
    { key: 'whatsapp', label: 'WhatsApp internacional, solo números', selector: '#btn-whatsapp', attr: 'href', type: 'text', transform: 'wa' },
    { key: 'email', label: 'Email de contacto', selector: '#btn-email', attr: 'href', type: 'email', transform: 'mailto' }
  ];
  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function hashPin(pin) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(function(buf) {
        return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    var h = 0; for (var i = 0; i < pin.length; i++) h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
    return Promise.resolve('fallback-' + h);
  }
  function getValue(field) {
    var el = document.querySelector(field.selector); if (!el) return '';
    if (field.attr) {
      var attr = el.getAttribute(field.attr) || '';
      if (field.transform === 'wa') return attr.replace(/\D/g, '');
      if (field.transform === 'mailto') return attr.replace(/^mailto:/, '');
      return attr;
    }
    return (el.textContent || '').trim();
  }
  function setValue(field, value) {
    var el = document.querySelector(field.selector); if (!el || value === undefined || value === null) return;
    if (field.attr) {
      if (field.transform === 'wa') {
        var phone = String(value).replace(/\D/g, '');
        el.setAttribute('href', 'https://wa.me/' + phone);
        el.lastChild.textContent = '\n      WhatsApp: ' + formatPhone(phone) + '\n    ';
      } else if (field.transform === 'mailto') {
        el.setAttribute('href', 'mailto:' + value);
        el.lastChild.textContent = '\n      ' + value + '\n    ';
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) { a.setAttribute('href', 'mailto:' + value); });
      } else { el.setAttribute(field.attr, value); }
    } else { el.textContent = value; }
  }
  function formatPhone(phone) { if (phone.indexOf('34') === 0 && phone.length === 11) phone = phone.slice(2); return phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4'); }
  function getContent() { var saved = readJSON(STORAGE_CONTENT, {}), data = {}; contentFields.forEach(function(f) { data[f.key] = saved[f.key] || getValue(f); }); return data; }
  function applyContent() { var data = readJSON(STORAGE_CONTENT, {}); contentFields.forEach(function(f) { if (Object.prototype.hasOwnProperty.call(data, f.key)) setValue(f, data[f.key]); }); updateSummary(); }
  function buildContentForm() {
    var wrap = document.getElementById('creator-admin-content-fields'); if (!wrap) return;
    var data = getContent(); wrap.innerHTML = '';
    contentFields.forEach(function(f) {
      var row = document.createElement('div'); row.className = 'creator-admin-field' + (f.type === 'textarea' ? ' full' : '');
      var label = document.createElement('label'); label.setAttribute('for', 'admin-field-' + f.key); label.textContent = f.label;
      var input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input'); input.id = 'admin-field-' + f.key; input.name = f.key; input.type = f.type === 'email' ? 'email' : 'text'; input.value = data[f.key] || '';
      row.appendChild(label); row.appendChild(input); wrap.appendChild(row);
    });
  }
  function collectContentForm() { var data = {}; contentFields.forEach(function(f) { var input = document.getElementById('admin-field-' + f.key); data[f.key] = input ? input.value.trim() : ''; }); return data; }
  function openPanel() { root.classList.add('open'); root.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; logged ? showShell() : showLogin(); }
  function closePanel() { root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (location.hash === '#panel-eva') history.replaceState(null, '', location.pathname + location.search); }
  function showLogin() { shell.hidden = true; login.hidden = false; loginCopy.textContent = localStorage.getItem(STORAGE_PIN) ? 'Introduce el PIN de Eva para abrir el panel.' : 'Crea un PIN para proteger este panel en este navegador.'; loginStatus.textContent = ''; setTimeout(function() { pinInput.focus(); }, 60); }
  function showShell() { logged = true; sessionStorage.setItem('creator_admin_unlocked', '1'); login.hidden = true; shell.hidden = false; buildContentForm(); renderLeads(); updateSummary(); }
  function updateSummary() {
    var services = document.querySelectorAll('.svc-panel').length, leads = readJSON(STORAGE_LEADS, []);
    var servicesEl = document.getElementById('admin-count-services'), leadsEl = document.getElementById('admin-count-requests'), updatedEl = document.getElementById('admin-count-updated');
    if (servicesEl) servicesEl.textContent = services; if (leadsEl) leadsEl.textContent = leads.length; if (updatedEl) updatedEl.textContent = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
  function escapeHTML(value) { return String(value || '').replace(/[&<>"']/g, function(ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; }); }
  function renderLeads() {
    var tbody = document.getElementById('admin-leads-table'); if (!tbody) return;
    var leads = readJSON(STORAGE_LEADS, []); tbody.innerHTML = '';
    if (!leads.length) { tbody.innerHTML = '<tr><td colspan="7" class="creator-admin-muted">Todavía no hay solicitudes guardadas.</td></tr>'; updateSummary(); return; }
    leads.forEach(function(lead, index) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHTML(lead.date) + '</td><td>' + escapeHTML(lead.name) + '</td><td>' + escapeHTML(lead.service) + '</td><td>' + escapeHTML(lead.channel) + '</td><td>' + escapeHTML(lead.status) + '</td><td>' + escapeHTML(lead.notes) + '</td><td><button class="creator-admin-btn danger" type="button" data-delete-lead="' + index + '">Borrar</button></td>';
      tbody.appendChild(tr);
    }); updateSummary();
  }
  function download(filename, content, type) { var blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); }
  function downloadUpdatedHTML() { var wasOpen = root.classList.contains('open'); root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); download('evavidalnutricion-actualizada.html', '<!DOCTYPE html>\n' + document.documentElement.outerHTML, 'text/html;charset=utf-8'); if (wasOpen) { root.classList.add('open'); root.setAttribute('aria-hidden', 'false'); } }
  function exportState() { return { exportedAt: new Date().toISOString(), content: readJSON(STORAGE_CONTENT, {}), leads: readJSON(STORAGE_LEADS, []) }; }
  document.getElementById('creator-admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault(); var pin = pinInput.value.trim(); if (pin.length < 4) { loginStatus.textContent = 'Usa un PIN de al menos 4 caracteres.'; return; }
    var savedHash = localStorage.getItem(STORAGE_PIN);
    hashPin(pin).then(function(hash) { if (!savedHash) { localStorage.setItem(STORAGE_PIN, hash); pinInput.value = ''; showShell(); return; } if (hash === savedHash) { pinInput.value = ''; showShell(); } else { loginStatus.textContent = 'PIN incorrecto.'; } });
  });
  document.querySelectorAll('[data-admin-close]').forEach(function(btn) { btn.addEventListener('click', closePanel); });
  document.querySelectorAll('[data-admin-tab]').forEach(function(btn) { btn.addEventListener('click', function() { var tab = btn.getAttribute('data-admin-tab'); document.querySelectorAll('[data-admin-tab]').forEach(function(b) { b.classList.toggle('active', b === btn); }); document.querySelectorAll('[data-admin-section]').forEach(function(section) { section.classList.toggle('active', section.getAttribute('data-admin-section') === tab); }); }); });
  document.getElementById('creator-admin-save-content').addEventListener('click', function() { saveJSON(STORAGE_CONTENT, collectContentForm()); applyContent(); document.getElementById('creator-admin-content-status').textContent = 'Cambios guardados en este navegador y aplicados a la vista.'; });
  document.getElementById('creator-admin-reset-content').addEventListener('click', function() { if (!confirm('¿Restaurar los cambios locales del panel?')) return; localStorage.removeItem(STORAGE_CONTENT); location.reload(); });
  document.getElementById('creator-admin-export-html').addEventListener('click', downloadUpdatedHTML); document.getElementById('admin-download-html-2').addEventListener('click', downloadUpdatedHTML);
  document.getElementById('admin-add-lead').addEventListener('click', function() { var leads = readJSON(STORAGE_LEADS, []), name = document.getElementById('admin-lead-name').value.trim(); if (!name) { document.getElementById('admin-lead-name').focus(); return; } leads.unshift({ date: new Date().toLocaleDateString('es-ES'), name: name, service: document.getElementById('admin-lead-service').value, channel: document.getElementById('admin-lead-channel').value, status: document.getElementById('admin-lead-status').value, notes: document.getElementById('admin-lead-notes').value.trim() }); saveJSON(STORAGE_LEADS, leads); document.getElementById('admin-lead-name').value = ''; document.getElementById('admin-lead-notes').value = ''; renderLeads(); });
  document.getElementById('admin-leads-table').addEventListener('click', function(e) { var btn = e.target.closest('[data-delete-lead]'); if (!btn) return; var leads = readJSON(STORAGE_LEADS, []); leads.splice(parseInt(btn.getAttribute('data-delete-lead'), 10), 1); saveJSON(STORAGE_LEADS, leads); renderLeads(); });
  document.getElementById('admin-clear-leads').addEventListener('click', function() { if (!confirm('¿Vaciar todas las solicitudes privadas?')) return; localStorage.removeItem(STORAGE_LEADS); renderLeads(); });
  document.getElementById('admin-download-json').addEventListener('click', function() { download('panel-eva-backup.json', JSON.stringify(exportState(), null, 2), 'application/json;charset=utf-8'); });
  document.getElementById('admin-copy-json').addEventListener('click', function() { var status = document.getElementById('creator-admin-export-status'), text = JSON.stringify(exportState(), null, 2); if (navigator.clipboard) navigator.clipboard.writeText(text).then(function() { status.textContent = 'JSON copiado al portapapeles.'; }); else status.textContent = text; });
  window.addEventListener('hashchange', function() { if (location.hash === '#panel-eva') openPanel(); });
  document.addEventListener('keydown', function(e) { if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') { e.preventDefault(); openPanel(); } if (e.key === 'Escape' && root.classList.contains('open')) { e.preventDefault(); e.stopPropagation(); closePanel(); } }, true);
  applyContent(); if (location.hash === '#panel-eva') openPanel();
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
// Ningún recurso externo (Google Fonts, GSAP, Analytics, píxeles) se carga
// hasta que el usuario acepta activamente las cookies.
//
// IMPORTANTE PARA EL SERVIDOR: replica estas cabeceras HTTP en tu servidor
// web (Apache .htaccess, Nginx, Cloudflare, etc.) para máxima protección:
//
//   Content-Security-Policy: [ver directiva completa en el bloque de comentarios del <head>]
//   X-Frame-Options: DENY
//   X-Content-Type-Options: nosniff
//   Referrer-Policy: no-referrer
//   Permissions-Policy: camera=(), microphone=(), geolocation=()
//   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
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
  if (typeof gsap === 'undefined') { applyNoAnimationFallback(); return; }
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
        toggleActions: isMobileDevice ? 'play none none none' : 'play reverse play reverse'
      }
    });
    heroTl
      .fromTo('.hero-eyebrow', { opacity: 0 }, { opacity: 1, duration: 0.6 })
      .fromTo('.hero-eyebrow-line', { width: 0 }, { width: 32, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .fromTo('.hero-title .line', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power4.out' }, '-=0.2')
      .fromTo('.hero-desc', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
      .fromTo('.hero-actions', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .fromTo('.hero-scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
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
      toggleActions: isMobileDevice ? 'play none none none' : 'play reverse play reverse',
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
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'bottom top',
            toggleActions: isMobileDevice ? 'play none none none' : 'play reverse play reverse'
          }
        }
      );
    }
  });


  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          end: 'bottom 10%',
          toggleActions: isMobileDevice ? 'play none none none' : 'play reverse play reverse'
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
            toggleActions: isMobileDevice ? 'play none none none' : 'play reverse play reverse'
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
  if (!isMobile) {
    var cur  = document.getElementById('fx-cursor');
    var ring = document.getElementById('fx-cursor-ring');
    if (cur && ring) {
      var cx = window.innerWidth/2, cy = window.innerHeight/2;
      var rx = cx, ry = cy;

    document.addEventListener('mousemove', function(e) {
      cx = e.clientX; cy = e.clientY;
      gsap.to(cur, { left: cx, top: cy, duration: 0.08, ease: 'none' });
    });

    // Ring sigue con lag suave
    (function ringLoop() {
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
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

// ── Carga de recursos visuales esenciales (Fonts + GSAP para animaciones)
var _coreResourcesLoaded = false;
function loadCoreResources(callback) {
  if (_coreResourcesLoaded) { if (callback) callback(); return; }
  _coreResourcesLoaded = true;

  // 1. Google Fonts
  var link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap';
  document.head.appendChild(link);

  // 2. GSAP + ScrollTrigger (carga encadenada)
  if (typeof gsap === 'undefined') {
    var gsapScript = document.createElement('script');
    gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    gsapScript.onload = function() {
      var stScript = document.createElement('script');
      stScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
      stScript.onload = function() { if (callback) callback(); };
      document.head.appendChild(stScript);
    };
    gsapScript.onerror = function() {
      applyNoAnimationFallback();
    };
    document.head.appendChild(gsapScript);
  } else {
    if (callback) callback();
  }
}

// Iniciar recursos visuales y animaciones inmediatamente
loadCoreResources(initAnimations);

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
  btns.forEach(function(btn) { btn.classList.add('disabled-contact'); });
  if (hint) hint.classList.remove('hidden');
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
  document.title = 'Eva Vidal Nutrición | Dietista y Nutricionista en Guadalajara';
  // Sin pushState: simplemente cerramos el overlay.
  window.scrollTo({ top: _legalScrollPos, behavior: 'instant' });
}

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
    if (window.innerWidth > 720 && btn.getAttribute('aria-expanded') === 'true') {
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
  if (!counters.length) return;

  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || '';
    if (target === 0) return; // ∞ — already shows symbol, skip
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
      card.style.transform = 'translateX(' + (isMobile ? sl.x * 0.4 : sl.x) + 'px) translateZ(' + sl.z + 'px) rotateY(' + sl.ry + 'deg) scale(' + sl.s + ')';
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

// ════════════════════════════════════════════════════════════════════════════
// 🛡️ SEGURIDAD Y PROTECCIÓN DE DATOS
// ════════════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ── 1. ANTI-XSS: sanitizar cualquier input en formularios ─────────────
  function sanitizeInput(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
  document.querySelectorAll('input, textarea').forEach(function(el) {
    el.addEventListener('input', function() {
      if (/<script|javascript:|on\w+\s*=/i.test(el.value)) {
        el.value = sanitizeInput(el.value.replace(/<script.*?>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, ''));
      }
    });
  });

  // ── 2. ANTI-FORM-HIJACK: validar que los formularios apuntan al destino correcto ─
  document.querySelectorAll('form').forEach(function(form) {
    var originalAction = form.action;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'action') {
          if (form.action !== originalAction) {
            form.action = originalAction;
            console.warn('[SECURITY] Intento de manipulación de formulario corregido.');
          }
        }
      });
    });
    observer.observe(form, { attributes: true });
  });

  // ── 3. ANTI-LINK-HIJACK: proteger enlaces externos ────────────────────
  document.querySelectorAll('a[target="_blank"]').forEach(function(a) {
    a.setAttribute('rel', 'noopener noreferrer');
  });

  // ── 4. INTEGRIDAD DE COOKIES: proteger contra manipulación ────────────
  if (location.protocol === 'https:') {
    var origCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                     Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
    if (origCookie) {
      Object.defineProperty(document, 'cookie', {
        get: function() { return origCookie.get.call(this); },
        set: function(val) {
          if (val.indexOf('Secure') === -1) val += '; Secure';
          if (val.indexOf('SameSite') === -1) val += '; SameSite=Strict';
          return origCookie.set.call(this, val);
        }
      });
    }
  }

  // ── 5. ANTI-TAMPERING: verificar integridad de enlaces críticos ────────
  var criticalLinks = document.querySelectorAll('#btn-whatsapp, #btn-email');
  criticalLinks.forEach(function(link) {
    var originalHref = link.getAttribute('href');
    var linkObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'href') {
          var newHref = link.getAttribute('href');
          if (newHref !== originalHref) {
            link.setAttribute('href', originalHref);
            console.error('[SECURITY] Intento de manipulación de enlace de contacto bloqueado.');
          }
        }
      });
    });
    linkObserver.observe(link, { attributes: true });
  });

})();


// SMOOTH PAGE TRANSITIONS
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('#main-nav a, .blog-back-btn, .footer-col-links a').forEach(a => {
        a.addEventListener('click', function(e) {
            // Only transition for internal html links (not hash anchors)
            var href = a.getAttribute('href') || '';
            if (href.startsWith('#') || href.indexOf('#') === 0) return;
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
