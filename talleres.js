// Pinta las tarjetas de talleres a partir de talleres-config.js (generado por el Gestor).
(function() {
  const grid = document.getElementById('talleres-grid');
  const emptyMsg = document.getElementById('talleres-empty');
  if (!grid || !emptyMsg) return;
  if (!window.TALLERES || TALLERES.length === 0) {
    grid.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  grid.innerHTML = TALLERES.map(function(t) {
    const esCompleto = t.estado === 'completo';
    const statusClass = esCompleto ? 'taller-status full' : 'taller-status';
    const statusText = esCompleto ? 'Completo' : 'Plazas Abiertas';
    const btnClass = esCompleto ? 'taller-btn disabled' : 'taller-btn';
    const btnText = esCompleto ? 'Plazas Agotadas' : 'Me apunto';
    const btnHref = esCompleto ? '#' : 'contacto.html';

    // Iconos SVG
    const clockSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

    const isOnline = String(t.modalidad || '').toLowerCase().includes('online');
    const locationSVG = isOnline
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

    return '<div class="taller-card">'
      + '<div class="taller-header">'
      +   '<div class="taller-date"><span class="day">' + esc(t.dia) + '</span><span class="month">' + esc(t.mes) + '</span></div>'
      +   '<span class="' + statusClass + '">' + statusText + '</span>'
      + '</div>'
      + '<div class="taller-info">'
      +   '<h3>' + esc(t.titulo) + '</h3>'
      +   '<p>' + esc(t.descripcion) + '</p>'
      +   '<div class="taller-meta"><span>' + clockSVG + ' ' + esc(t.duracion) + '</span><span>' + locationSVG + ' ' + esc(t.modalidad) + '</span></div>'
      + '</div>'
      + '<div class="taller-action">'
      +   '<span class="taller-price">' + esc(t.precio) + '€</span>'
      +   '<a href="' + btnHref + '" class="' + btnClass + '">' + btnText + '</a>'
      + '</div>'
      + '</div>';
  }).join('');
})();
