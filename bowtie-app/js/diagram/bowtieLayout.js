/*
 * Calcula posiciones FIJAS (preset) de todos los nodos/edges de un diagrama BowTie para
 * un Evento Tope dado, en función del estado de interacción actual (ramas colapsadas,
 * lado colapsado, vista simple/completa). No usa layout de fuerzas: cada nodo recibe x,y
 * explícitos para que el diagrama sea predecible y editable.
 *
 * Convenciones de espaciado (en px, coordenadas del propio Cytoscape):
 */
const LAYOUT = {
  rowHeight: 130,      // separación vertical entre ramas (amenaza/consecuencia); debe superar la altura del ícono de barrera
  colWidth: 170,       // separación horizontal entre columnas (amenaza -> barreras -> evento)
  eventoX: 0,
  toggleOffset: 40,    // separación del botón +/- respecto a su nodo
  sideToggleOffsetX: 35,
  sideToggleOffsetY: 35, // baja el botón +/- del evento para no superponerse con la línea central
  minBarreraSpacing: 150,
};

function toggleNode(id, x, y, collapsed, parentIds) {
  return {
    data: { id, isToggle: true, collapsed, targets: parentIds },
    position: { x, y },
    classes: collapsed ? 'toggle-node toggle-collapsed' : 'toggle-node toggle-expanded',
  };
}

/**
 * side: 'izq' (amenazas) | 'der' (consecuencias)
 * items: array de amenazas o consecuencias del evento, ya filtradas por colapso de lado.
 * viewMode: 'simple' | 'completa'
 * collapsedSet: Set de IDs de amenaza/consecuencia colapsadas individualmente.
 */
function buildSideElements(side, items, viewMode, collapsedSet, eventoId) {
  const elements = [];
  const signo = side === 'izq' ? -1 : 1;
  const visibleItems = items; // el colapso individual no quita la fila, solo sus barreras

  const totalRows = visibleItems.length;
  const startY = -((totalRows - 1) * LAYOUT.rowHeight) / 2;

  visibleItems.forEach((item, idx) => {
    const y = startY + idx * LAYOUT.rowHeight;
    const isCollapsed = collapsedSet.has(item.id);
    const nombreCorto = item.nombre;

    const barreras = item.barreras || [];
    const showBarreras = viewMode === 'completa' && barreras.length > 0 && !item.sinBarreras;

    // Posición X de la amenaza/consecuencia: más lejos si hay más barreras que dibujar
    const numCols = showBarreras && !isCollapsed ? barreras.length : 0;
    const amenazaX = signo * LAYOUT.colWidth * (numCols + 1);

    elements.push({
      data: {
        id: item.id,
        label: nombreCorto,
        kind: side === 'izq' ? 'amenaza' : 'consecuencia',
        raw: item,
      },
      position: { x: amenazaX, y },
      classes: side === 'izq' ? 'amenaza-node' : 'consecuencia-node',
    });

    // Botón +/- individual de la rama, pegado al nodo hacia afuera
    elements.push(
      toggleNode(
        `toggle:${item.id}`,
        amenazaX + signo * LAYOUT.toggleOffset,
        y,
        isCollapsed,
        [item.id]
      )
    );

    const sinBarreraVisual = item.sinBarreras || viewMode === 'simple' || isCollapsed;

    if (sinBarreraVisual || barreras.length === 0) {
      // Línea directa (discontinua si es un hallazgo real de "sin barrera")
      elements.push({
        data: {
          id: `edge:${item.id}:${eventoId}`,
          source: side === 'izq' ? item.id : eventoId,
          target: side === 'izq' ? eventoId : item.id,
        },
        classes: item.sinBarreras ? 'edge-directa edge-sin-barrera' : 'edge-directa',
      });
      return;
    }

    // Cadena de barreras entre la amenaza/consecuencia y el evento tope
    let prevNodeId = item.id;
    let prevX = amenazaX;
    barreras.forEach((barrera, bIdx) => {
      const bx = signo * LAYOUT.colWidth * (numCols - bIdx);
      elements.push({
        data: {
          id: barrera.id,
          label: barrera.nombre,
          kind: 'barrera',
          semaforo: barrera.semaforo,
          raw: barrera,
        },
        position: { x: bx, y },
        classes: `barrera-node semaforo-${barrera.semaforo.toLowerCase()}`,
      });
      elements.push({
        data: {
          id: `edge:${prevNodeId}:${barrera.id}`,
          source: side === 'izq' ? prevNodeId : barrera.id,
          target: side === 'izq' ? barrera.id : prevNodeId,
        },
        classes: 'edge-barrera',
      });
      prevNodeId = barrera.id;
      prevX = bx;
    });

    elements.push({
      data: {
        id: `edge:${prevNodeId}:${eventoId}`,
        source: side === 'izq' ? prevNodeId : eventoId,
        target: side === 'izq' ? eventoId : prevNodeId,
      },
      classes: 'edge-barrera',
    });
  });

  return elements;
}

/**
 * state = {
 *   collapsedAmenazas: Set<string>, collapsedConsecuencias: Set<string>,
 *   leftCollapsed: bool, rightCollapsed: bool, viewMode: 'simple'|'completa'
 * }
 */
function buildDiagramElements(evento, state) {
  const elements = [];

  elements.push({
    data: { id: evento.id, label: evento.nombre, kind: 'evento', raw: evento },
    position: { x: LAYOUT.eventoX, y: 0 },
    classes: 'evento-node',
  });

  elements.push({
    data: { id: `peligro:${evento.id}`, label: evento.peligro, kind: 'peligro' },
    position: { x: LAYOUT.eventoX, y: -LAYOUT.rowHeight * 1.3 },
    classes: 'peligro-node',
  });
  elements.push({
    data: { id: `edge:peligro:${evento.id}`, source: `peligro:${evento.id}`, target: evento.id },
    classes: 'edge-peligro',
  });

  // Botones de colapso de lado completo, pegados a cada costado del evento
  elements.push(
    toggleNode(
      'toggle:lado:izq',
      LAYOUT.eventoX - LAYOUT.sideToggleOffsetX,
      LAYOUT.sideToggleOffsetY,
      state.leftCollapsed,
      evento.amenazas.map((a) => a.id)
    )
  );
  elements.push(
    toggleNode(
      'toggle:lado:der',
      LAYOUT.eventoX + LAYOUT.sideToggleOffsetX,
      LAYOUT.sideToggleOffsetY,
      state.rightCollapsed,
      evento.consecuencias.map((c) => c.id)
    )
  );

  if (!state.leftCollapsed) {
    elements.push(
      ...buildSideElements('izq', evento.amenazas, state.viewMode, state.collapsedAmenazas, evento.id)
    );
  }
  if (!state.rightCollapsed) {
    elements.push(
      ...buildSideElements('der', evento.consecuencias, state.viewMode, state.collapsedConsecuencias, evento.id)
    );
  }

  return elements;
}

window.BowtieLayout = { buildDiagramElements, LAYOUT };
