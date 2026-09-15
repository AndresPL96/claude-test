/*
 * Cablea toda la interfaz (toolbar, selector de evento, filtros, panel de detalle,
 * panel de KPIs, panel de validación) alrededor de un diagramRenderer ya creado.
 * Se usa tanto desde index.html (datos reales del Excel) como desde test-diagram.html
 * (datos fijos de prueba), para no duplicar el cableado de UI.
 */
function initAppShell(dom, datos) {
  const { modelo, kpis, report } = datos;

  if (dom.cyContainer.__cy) dom.cyContainer.__cy.destroy();

  const renderer = window.BowtieDiagramRenderer.createDiagramRenderer(dom.cyContainer, {
    onBarreraClick: (barrera) => showBarreraDetail(dom.detailPanel, barrera),
    onConsecuenciaClick: (consecuencia) => showConsecuenciaDetail(dom.detailPanel, consecuencia),
    onAmenazaClick: (amenaza) => showAmenazaDetail(dom.detailPanel, amenaza),
  });
  dom.cyContainer.__cy = renderer.cy;

  window.BowtieEventSelector.wireEventSelector(dom.eventSelect, modelo, (evento) => {
    renderer.setEvento(evento);
    dom.detailPanel.innerHTML = '<p class="hint">Haz clic en una barrera, amenaza o consecuencia para ver el detalle.</p>';
  });

  window.BowtieFilters.wireProcesoAreaFilter(dom.areaSelect, modelo, (filtrados) => {
    window.BowtieEventSelector.wireEventSelector(dom.eventSelect, filtrados, (evento) => renderer.setEvento(evento));
  });
  window.BowtieFilters.wireSemaforoFilter(dom.semaforoSelect, renderer.cy);

  dom.btnVistaSimple.onclick = () => {
    renderer.setViewMode('simple');
    dom.btnVistaSimple.classList.add('active');
    dom.btnVistaCompleta.classList.remove('active');
  };
  dom.btnVistaCompleta.onclick = () => {
    renderer.setViewMode('completa');
    dom.btnVistaCompleta.classList.add('active');
    dom.btnVistaSimple.classList.remove('active');
  };
  dom.btnVistaCompleta.classList.add('active');
  dom.btnVistaSimple.classList.remove('active');

  dom.btnExportPng.onclick = () => {
    window.BowtieExportPng.exportDiagramToPng(renderer.cy, 'bowtie-diagrama.png');
  };

  dom.kpiPanel.style.display = 'block';
  renderKpis(dom.kpiPanel, kpis);
  if (report && report.issues && report.issues.length > 0) {
    renderValidationPanel(dom.validationPanel, report.issues);
  }

  return renderer;
}

function renderKpis(container, kpis) {
  const cards = [
    ['Eventos Tope', kpis.totalEventos],
    ['Amenazas', kpis.totalAmenazas],
    ['Consecuencias', kpis.totalConsecuencias],
    ['Barreras Preventivas', kpis.totalBarrerasPreventivas],
    ['Barreras Mitigadoras', kpis.totalBarrerasMitigadoras],
    ['Prev. en ROJO', kpis.barrerasPrevRojo],
    ['Mit. en ROJO', kpis.barrerasMitRojo],
    ['Efectividad prom. Prev.', `${kpis.efectividadPromedioPrev}%`],
    ['Efectividad prom. Mit.', `${kpis.efectividadPromedioMit}%`],
    ['Amenazas sin barrera', kpis.amenazasSinBarrera],
    ['Consecuencias sin barrera', kpis.consecuenciasSinBarrera],
  ];
  container.innerHTML =
    '<h3>Indicadores</h3><div class="kpi-grid">' +
    cards.map(([label, valor]) => `<div class="kpi-card"><div>${label}</div><div class="valor">${valor}</div></div>`).join('') +
    '</div>';
}

function renderValidationPanel(container, issues) {
  container.style.display = 'block';
  container.innerHTML =
    `<button class="close-btn" aria-label="Cerrar">✕</button>
     <h3>Advertencias de validación (${issues.length})</h3>
     <ul>${issues.map((i) => `<li><strong>${i.sheet}</strong> fila ${i.rowNumber} (${i.type}): ${i.message}</li>`).join('')}</ul>`;
  container.querySelector('.close-btn').addEventListener('click', () => {
    container.style.display = 'none';
  });
}

function showBarreraDetail(container, barrera) {
  const factoresHtml = (barrera.factores || [])
    .map(
      (f) => `
      <li>${f.nombre}
        ${f.controles.length ? `<ul>${f.controles.map((c) => `<li>${c.nombre} (${c.efectividadPct}% · ${c.estado})</li>`).join('')}</ul>` : ''}
      </li>`
    )
    .join('');
  container.innerHTML = `
    <h3>Barrera: ${barrera.nombre}</h3>
    <dl>
      <dt>Tipo</dt><dd>${barrera.tipo || '—'}</dd>
      <dt>Criticidad</dt><dd>${barrera.criticidad || '—'}</dd>
      <dt>Estado</dt><dd>${barrera.estado || '—'}</dd>
      <dt>Efectividad</dt><dd>${barrera.efectividadPct}%</dd>
      <dt>Última verificación</dt><dd>${barrera.ultimaVerificacion || '—'}</dd>
      <dt>Responsable</dt><dd>${barrera.responsable || '—'}</dd>
      <dt>Semáforo</dt><dd>${barrera.semaforo}</dd>
    </dl>
    ${factoresHtml ? `<h4>Factores de escalamiento</h4><ul>${factoresHtml}</ul>` : '<p class="hint">Sin factores de escalamiento.</p>'}
  `;
}

function showConsecuenciaDetail(container, consecuencia) {
  container.innerHTML = `
    <h3>Consecuencia: ${consecuencia.nombre}</h3>
    <dl>
      <dt>Severidad (1-5)</dt><dd>${consecuencia.severidad}</dd>
      <dt>Categoría de impacto</dt><dd>${consecuencia.categoriaImpacto || '—'}</dd>
      <dt>Descripción</dt><dd>${consecuencia.descripcion || '—'}</dd>
    </dl>
  `;
}

function showAmenazaDetail(container, amenaza) {
  container.innerHTML = `
    <h3>Amenaza: ${amenaza.nombre}</h3>
    <dl>
      <dt>Categoría</dt><dd>${amenaza.categoria || '—'}</dd>
      <dt>Descripción</dt><dd>${amenaza.descripcion || '—'}</dd>
    </dl>
  `;
}

window.BowtieAppShell = { initAppShell, renderValidationPanel };
