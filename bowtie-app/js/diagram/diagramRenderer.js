/*
 * Inicializa y controla la instancia de Cytoscape: construye elementos con bowtieLayout,
 * aplica estilos de cytoscapeStyles, y reacciona a clics en los nodos-botón de colapso.
 * El arrastre libre de nodos está desactivado (layout siempre fijo/calculado).
 */
function createDiagramRenderer(container, options) {
  const onBarreraClick = options.onBarreraClick || (() => {});
  const onConsecuenciaClick = options.onConsecuenciaClick || (() => {});
  const onAmenazaClick = options.onAmenazaClick || (() => {});
  const onFactorClick = options.onFactorClick || (() => {});
  const onControlClick = options.onControlClick || (() => {});

  const state = {
    collapsedAmenazas: new Set(),
    collapsedConsecuencias: new Set(),
    leftCollapsed: false,
    rightCollapsed: false,
    viewMode: 'completa', // 'simple' | 'completa'
    semaforoFiltro: '',
  };

  let evento = null;

  const cy = cytoscape({
    container,
    style: window.BowtieCytoscapeStyles.bowtieStylesheet(),
    layout: { name: 'preset' },
    userPanningEnabled: true,
    userZoomingEnabled: true,
    boxSelectionEnabled: false,
    autoungrabify: true, // desactiva el arrastre libre de nodos
  });

  function render() {
    if (!evento) return;
    const elements = window.BowtieLayout.buildDiagramElements(evento, state);
    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: 'preset' }).run();
    cy.fit(undefined, 60);
    applySemaforoFilter();
  }

  // Se reaplica en cada render porque `cy.elements().remove()` descarta los estilos en línea.
  function applySemaforoFilter() {
    const estado = state.semaforoFiltro;
    cy.nodes('.barrera-node').forEach((node) => {
      node.style('opacity', !estado || node.data('semaforo') === estado ? 1 : 0.2);
    });
  }

  function setSemaforoFilter(estado) {
    state.semaforoFiltro = estado || '';
    applySemaforoFilter();
  }

  function setEvento(nuevoEvento) {
    evento = nuevoEvento;
    state.collapsedAmenazas.clear();
    state.collapsedConsecuencias.clear();
    state.leftCollapsed = false;
    state.rightCollapsed = false;
    render();
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    render();
  }

  // Resalta la ruta completa (amenaza/consecuencia + sus barreras + tramos) bajo el cursor
  cy.on('mouseover', 'node[row]', (evt) => {
    const row = evt.target.data('row');
    cy.elements(`[row = "${row}"]`).addClass('hl');
    container.style.cursor = 'pointer';
  });
  cy.on('mouseout', 'node[row]', () => {
    cy.elements('.hl').removeClass('hl');
    container.style.cursor = '';
  });
  cy.on('mouseover', '.toggle-node', () => {
    container.style.cursor = 'pointer';
  });
  cy.on('mouseout', '.toggle-node', () => {
    container.style.cursor = '';
  });

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    const data = node.data();

    if (data.isToggle) {
      if (node.id() === 'toggle:lado:izq') {
        state.leftCollapsed = !state.leftCollapsed;
      } else if (node.id() === 'toggle:lado:der') {
        state.rightCollapsed = !state.rightCollapsed;
      } else {
        const targetId = data.targets[0];
        const esAmenaza = evento.amenazas.some((a) => a.id === targetId);
        const set = esAmenaza ? state.collapsedAmenazas : state.collapsedConsecuencias;
        if (set.has(targetId)) set.delete(targetId);
        else set.add(targetId);
      }
      render();
      return;
    }

    if (data.kind === 'barrera') onBarreraClick(data.raw);
    else if (data.kind === 'factor-escalamiento') onFactorClick(data.raw);
    else if (data.kind === 'control-escalamiento') onControlClick(data.raw);
    else if (data.kind === 'consecuencia') onConsecuenciaClick(data.raw);
    else if (data.kind === 'amenaza') onAmenazaClick(data.raw);
  });

  return { cy, setEvento, setViewMode, setSemaforoFilter, getState: () => state };
}

window.BowtieDiagramRenderer = { createDiagramRenderer };
