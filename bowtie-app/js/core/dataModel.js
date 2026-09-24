/*
 * Construye el modelo BowTie (uno por Evento Tope) a partir de las hojas ya limpiadas
 * por dataValidator. No confía en la columna Semaforo cruda del Excel: la recalcula.
 *
 * Regla (igual a la fórmula de la columna Semaforo en Barreras_Preventivas/Mitigadoras):
 * depende solo de Estado; Criticidad es informativa y no afecta el color.
 *   Operativa         => VERDE
 *   Degradada         => AMARILLO
 *   Fuera de servicio => ROJO
 *   otro / vacío      => SIN_DATOS
 */
function calcSemaforo(estado) {
  if (estado === 'Operativa') return 'VERDE';
  if (estado === 'Degradada') return 'AMARILLO';
  if (estado === 'Fuera de servicio') return 'ROJO';
  return 'SIN_DATOS';
}

function buildBarrera(row) {
  return {
    id: row.ID_Barrera,
    nombre: row.Nombre_Barrera,
    tipo: row.Tipo,
    criticidad: row.Criticidad,
    estado: row.Estado,
    ultimaVerificacion: row.Ultima_Verificacion,
    responsable: row.Responsable,
    semaforo: calcSemaforo(row.Estado),
    factores: [],
  };
}

/**
 * Ensambla el modelo completo a partir de las hojas ya validadas/limpiadas.
 * clean = { Eventos_Tope, Amenazas, Consecuencias, Barreras_Preventivas,
 *           Barreras_Mitigadoras, Factores_Escalamiento, Controles_Escalamiento }
 * (cada una ya es un array de filas válidas, sin huérfanas)
 *
 * Devuelve un array de eventos: [{ id, nombre, peligro, ..., amenazas: [...], consecuencias: [...] }]
 */
function buildBowtieModel(clean) {
  // Índice de barreras por ID para colgarles los factores de escalamiento
  const barrerasPrevPorId = new Map();
  const barrerasMitPorId = new Map();

  const amenazasPorEvento = new Map();
  clean.Amenazas.forEach((am) => {
    const lista = amenazasPorEvento.get(am.ID_Evento) || [];
    lista.push(am);
    amenazasPorEvento.set(am.ID_Evento, lista);
  });

  const consecuenciasPorEvento = new Map();
  clean.Consecuencias.forEach((co) => {
    const lista = consecuenciasPorEvento.get(co.ID_Evento) || [];
    lista.push(co);
    consecuenciasPorEvento.set(co.ID_Evento, lista);
  });

  const barrerasPrevPorAmenaza = new Map();
  clean.Barreras_Preventivas.forEach((bp) => {
    const barrera = buildBarrera(bp);
    barrerasPrevPorId.set(barrera.id, barrera);
    const lista = barrerasPrevPorAmenaza.get(bp.ID_Amenaza) || [];
    lista.push(barrera);
    barrerasPrevPorAmenaza.set(bp.ID_Amenaza, lista);
  });

  const barrerasMitPorConsecuencia = new Map();
  clean.Barreras_Mitigadoras.forEach((bm) => {
    const barrera = buildBarrera(bm);
    barrerasMitPorId.set(barrera.id, barrera);
    const lista = barrerasMitPorConsecuencia.get(bm.ID_Consecuencia) || [];
    lista.push(barrera);
    barrerasMitPorConsecuencia.set(bm.ID_Consecuencia, lista);
  });

  // Factores de escalamiento cuelgan de una barrera preventiva O mitigadora (FK polimórfica)
  const factoresPorBarrera = new Map(); // key: `${Hoja_Barrera}:${ID_Barrera}`
  clean.Factores_Escalamiento.forEach((fe) => {
    const key = `${fe.Hoja_Barrera}:${fe.ID_Barrera}`;
    const lista = factoresPorBarrera.get(key) || [];
    lista.push({
      id: fe.ID_Factor,
      nombre: fe.Nombre_Factor,
      descripcion: fe.Descripcion,
      controles: [],
    });
    factoresPorBarrera.set(key, lista);
  });

  clean.Controles_Escalamiento.forEach((ce) => {
    for (const lista of factoresPorBarrera.values()) {
      const factor = lista.find((f) => f.id === ce.ID_Factor);
      if (factor) {
        factor.controles.push({
          id: ce.ID_Control,
          nombre: ce.Nombre_Control,
          efectividadPct: Number(ce.Efectividad_Pct),
          estado: ce.Estado,
          semaforo: calcSemaforo(ce.Estado),
        });
      }
    }
  });

  for (const [key, lista] of factoresPorBarrera.entries()) {
    const [hoja, idBarrera] = key.split(':');
    const barrera = hoja === 'Barreras_Preventivas' ? barrerasPrevPorId.get(idBarrera) : barrerasMitPorId.get(idBarrera);
    if (barrera) barrera.factores = lista;
  }

  const eventos = clean.Eventos_Tope.map((ev) => {
    const amenazas = (amenazasPorEvento.get(ev.ID_Evento) || []).map((am) => ({
      id: am.ID_Amenaza,
      nombre: am.Nombre_Amenaza,
      categoria: am.Categoria,
      descripcion: am.Descripcion,
      barreras: barrerasPrevPorAmenaza.get(am.ID_Amenaza) || [],
      sinBarreras: (barrerasPrevPorAmenaza.get(am.ID_Amenaza) || []).length === 0,
    }));

    const consecuencias = (consecuenciasPorEvento.get(ev.ID_Evento) || []).map((co) => ({
      id: co.ID_Consecuencia,
      nombre: co.Nombre_Consecuencia,
      severidad: Number(co.Severidad_1a5),
      categoriaImpacto: co.Categoria_Impacto,
      descripcion: co.Descripcion,
      barreras: barrerasMitPorConsecuencia.get(co.ID_Consecuencia) || [],
      sinBarreras: (barrerasMitPorConsecuencia.get(co.ID_Consecuencia) || []).length === 0,
    }));

    return {
      id: ev.ID_Evento,
      nombre: ev.Nombre_Evento,
      peligro: ev.Peligro,
      descripcion: ev.Descripcion,
      procesoArea: ev.Proceso_Area,
      responsable: ev.Responsable,
      fechaActualizacion: ev.Fecha_Actualizacion,
      amenazas,
      consecuencias,
    };
  });

  return eventos;
}

window.BowtieDataModel = { buildBowtieModel, calcSemaforo };
