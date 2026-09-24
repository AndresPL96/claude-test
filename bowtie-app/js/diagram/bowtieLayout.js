/*
 * Calcula posiciones FIJAS (preset) de todos los nodos/edges de un diagrama BowTie para
 * un Evento Tope dado, en función del estado de interacción actual (ramas colapsadas,
 * lado colapsado, vista simple/completa). No usa layout de fuerzas: cada nodo recibe x,y
 * explícitos para que el diagrama sea predecible y editable.
 *
 * Convención de conexión: todas las aristas van de fuera hacia dentro (source = nodo más
 * lejano al evento, target = nodo más cercano) y son rectas.
 *
 * El giro ortogonal hacia el evento no se delega al motor de curvas (el modo `taxi` de
 * Cytoscape ignora los endpoints y deja el trazo colgando del borde de la caja): cada fila
 * termina en un nodo de unión invisible sobre el tronco vertical, y un único tramo lleva
 * del tronco al evento. Así el recorrido es el mismo que dibuja BowTie XP y es predecible.
 */
const LAYOUT = {
  rowHeight: 200,      // separación vertical entre ramas; supera la altura del nodo barrera (192)
  rowHeightSimple: 135, // sin barreras a la vista las filas son mucho más bajas
  colWidth: 190,       // separación horizontal entre columnas (amenaza -> barreras -> evento)
  baseOffset: 60,      // holgura extra entre el tronco y la primera columna de barreras
  spineX: 130,         // distancia del tronco vertical al centro del evento
  eventoX: 0,
  toggleOffset: 80,    // medio ancho del nodo amenaza/consecuencia: el botón cae sobre el borde
  peligroY: -185,
  subRowHeight: 170,   // separación de cada sub-fila de factor de escalamiento bajo su rama
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
  if (items.length === 0) return elements;

  const signo = side === 'izq' ? -1 : 1;
  const spineX = signo * LAYOUT.spineX;
  const spineId = `spine:${side}`;

  // Tronco vertical: todas las ramas del lado desembocan aquí y de aquí sale un solo
  // tramo al evento, en lugar de un abanico de diagonales cruzadas.
  elements.push({
    data: { id: spineId, isHelper: true },
    position: { x: spineX, y: 0 },
    classes: 'junction-node',
  });
  elements.push({
    data: { id: `edge:${spineId}:${eventoId}`, source: spineId, target: eventoId },
    classes: 'edge-row',
  });

  // Si en este lado no se dibuja ninguna barrera (vista simple o todo colapsado) las filas
  // no necesitan la altura del nodo barrera y el diagrama deja de verse estirado.
  const hayBarreras =
    viewMode === 'completa' &&
    items.some((it) => !it.sinBarreras && !collapsedSet.has(it.id) && (it.barreras || []).length > 0);
  const rowHeight = hayBarreras ? LAYOUT.rowHeight : LAYOUT.rowHeightSimple;

  // Cada factor de escalamiento visible ocupa una sub-fila propia bajo la rama, así que las
  // ramas ya no son de altura fija: se apilan según cuántas sub-filas traiga cada una.
  const filas = items.map((item) => {
    const barreras = item.barreras || [];
    const showBarreras =
      viewMode === 'completa' && barreras.length > 0 && !item.sinBarreras && !collapsedSet.has(item.id);
    const subFilas = [];
    if (showBarreras) {
      // En orden de barrera (de la más lejana a la más cercana al evento): así la línea de
      // subida de cada sub-fila nunca cruza la sub-fila de encima.
      barreras.forEach((barrera, bIdx) => {
        (barrera.factores || []).forEach((factor) => subFilas.push({ factor, barrera, bIdx }));
      });
    }
    return { item, showBarreras, subFilas };
  });

  const alturaFila = (f) => rowHeight + f.subFilas.length * LAYOUT.subRowHeight;
  const alturaTotal = filas.reduce((acc, f) => acc + alturaFila(f), 0) - rowHeight;
  let cursorY = -alturaTotal / 2;

  filas.forEach(({ item, showBarreras, subFilas }) => {
    const y = cursorY;
    cursorY += alturaFila({ subFilas });
    const isCollapsed = collapsedSet.has(item.id);

    const barreras = item.barreras || [];

    // Columna k (1 = la más cercana al evento). Las barreras de la rama ocupan 1..n; los
    // controles de un factor se ubican por fuera de la barrera que degradan, y la amenaza /
    // consecuencia se aleja lo necesario para que todo quepa.
    const colX = (k) => signo * (LAYOUT.baseOffset + LAYOUT.colWidth * k);
    const colBarrera = (bIdx) => barreras.length - bIdx;
    const numCols = showBarreras
      ? Math.max(
          barreras.length,
          ...subFilas.map((sf) => colBarrera(sf.bIdx) + sf.factor.controles.length)
        )
      : 0;
    const amenazaX = colX(numCols + 1);

    elements.push({
      data: {
        id: item.id,
        label: item.nombre,
        kind: side === 'izq' ? 'amenaza' : 'consecuencia',
        row: item.id,
        raw: item,
      },
      position: { x: amenazaX, y },
      classes: side === 'izq' ? 'amenaza-node' : 'consecuencia-node',
    });

    // Botón +/- de la rama, sobre el borde interior del nodo (el que mira al evento)
    elements.push(
      toggleNode(
        `toggle:${item.id}`,
        amenazaX - signo * LAYOUT.toggleOffset,
        y,
        isCollapsed,
        [item.id]
      )
    );

    // Cierra la rama: tramo horizontal hasta el tronco y tramo vertical sobre él.
    const conectarAlTronco = (lastId) => {
      const extra = item.sinBarreras ? ' edge-sin-barrera' : '';
      if (Math.abs(y) < 1) {
        elements.push({
          data: { id: `edge:${lastId}:${spineId}`, source: lastId, target: spineId, row: item.id },
          classes: `edge-row${extra}`,
        });
        return;
      }
      const juncId = `junc:${item.id}`;
      elements.push({
        data: { id: juncId, isHelper: true, row: item.id },
        position: { x: spineX, y },
        classes: 'junction-node',
      });
      elements.push({
        data: { id: `edge:${lastId}:${juncId}`, source: lastId, target: juncId, row: item.id },
        classes: `edge-row${extra}`,
      });
      elements.push({
        data: { id: `edge:${juncId}:${spineId}`, source: juncId, target: spineId, row: item.id },
        classes: `edge-row${extra}`,
      });
    };

    if (!showBarreras) {
      conectarAlTronco(item.id);
      return;
    }

    const pushBarrera = (barrera, x, yy, kind) => {
      elements.push({
        data: {
          id: barrera.id,
          label: barrera.nombre,
          kind,
          semaforo: barrera.semaforo,
          row: item.id,
          raw: barrera,
        },
        position: { x, y: yy },
        classes: `barrera-node semaforo-${barrera.semaforo.toLowerCase()}`,
      });
    };
    const pushEdge = (source, target, classes = 'edge-row') => {
      elements.push({
        data: { id: `edge:${source}:${target}`, source, target, row: item.id },
        classes,
      });
    };

    // Cadena de barreras entre la amenaza/consecuencia y el evento tope
    let prevNodeId = item.id;
    barreras.forEach((barrera, bIdx) => {
      pushBarrera(barrera, colX(colBarrera(bIdx)), y, 'barrera');
      pushEdge(prevNodeId, barrera.id);
      prevNodeId = barrera.id;
    });
    conectarAlTronco(prevNodeId);

    // Sub-amenazas: cada factor de escalamiento es una rama propia bajo la fila, con sus
    // controles como barreras, que remonta en ángulo recto hasta la barrera que degrada.
    subFilas.forEach(({ factor, barrera, bIdx }, sIdx) => {
      const sy = y + (sIdx + 1) * LAYOUT.subRowHeight;
      const parentCol = colBarrera(bIdx);
      const factorId = `factor:${factor.id}`;

      elements.push({
        data: {
          id: factorId,
          label: factor.nombre,
          kind: 'factor-escalamiento',
          row: item.id,
          raw: { ...factor, barrera },
        },
        position: { x: amenazaX, y: sy },
        classes: 'factor-node',
      });

      let prevId = factorId;
      const n = factor.controles.length;
      factor.controles.forEach((control, cIdx) => {
        pushBarrera(control, colX(parentCol + n - cIdx), sy, 'control-escalamiento');
        pushEdge(prevId, control.id);
        prevId = control.id;
      });

      const juncId = `junc:${factorId}`;
      elements.push({
        data: { id: juncId, isHelper: true, row: item.id },
        position: { x: colX(parentCol), y: sy },
        classes: 'junction-node',
      });
      pushEdge(prevId, juncId);
      pushEdge(juncId, barrera.id);
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
    position: { x: LAYOUT.eventoX, y: LAYOUT.peligroY },
    classes: 'peligro-node',
  });
  elements.push({
    data: { id: `edge:peligro:${evento.id}`, source: `peligro:${evento.id}`, target: evento.id },
    classes: 'edge-peligro',
  });

  // Botones de colapso de lado completo, sobre el punto de conexión de cada costado
  elements.push(
    toggleNode(
      'toggle:lado:izq',
      LAYOUT.eventoX - LAYOUT.spineX,
      0,
      state.leftCollapsed,
      evento.amenazas.map((a) => a.id)
    )
  );
  elements.push(
    toggleNode(
      'toggle:lado:der',
      LAYOUT.eventoX + LAYOUT.spineX,
      0,
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
