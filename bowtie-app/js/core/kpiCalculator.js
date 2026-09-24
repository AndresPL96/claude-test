/*
 * Calcula KPIs a partir de las hojas ya limpias (post-validación). Recalcula Semaforo con
 * dataModel.calcSemaforo en vez de confiar en la columna cruda, para que coincida con el
 * diagrama.
 */
function calcularKpis(clean) {
  const semaforoPrev = clean.Barreras_Preventivas.map((b) =>
    window.BowtieDataModel.calcSemaforo(b.Estado)
  );
  const semaforoMit = clean.Barreras_Mitigadoras.map((b) =>
    window.BowtieDataModel.calcSemaforo(b.Estado)
  );

  const contarRojo = (arr) => arr.filter((s) => s === 'ROJO').length;

  const amenazasConBarrera = new Set(clean.Barreras_Preventivas.map((b) => b.ID_Amenaza));
  const consecuenciasConBarrera = new Set(clean.Barreras_Mitigadoras.map((b) => b.ID_Consecuencia));

  const amenazasSinBarrera = clean.Amenazas.filter((a) => !amenazasConBarrera.has(a.ID_Amenaza)).length;
  const consecuenciasSinBarrera = clean.Consecuencias.filter((c) => !consecuenciasConBarrera.has(c.ID_Consecuencia)).length;

  const criticasDegradadasPrev = clean.Barreras_Preventivas.filter(
    (b) => b.Criticidad === 'Crítica' && (b.Estado === 'Degradada' || b.Estado === 'Fuera de servicio')
  ).length;
  const criticasDegradadasMit = clean.Barreras_Mitigadoras.filter(
    (b) => b.Criticidad === 'Crítica' && (b.Estado === 'Degradada' || b.Estado === 'Fuera de servicio')
  ).length;

  return {
    totalEventos: clean.Eventos_Tope.length,
    totalAmenazas: clean.Amenazas.length,
    totalConsecuencias: clean.Consecuencias.length,
    totalBarrerasPreventivas: clean.Barreras_Preventivas.length,
    totalBarrerasMitigadoras: clean.Barreras_Mitigadoras.length,
    barrerasPrevRojo: contarRojo(semaforoPrev),
    barrerasMitRojo: contarRojo(semaforoMit),
    criticasDegradadasPrev,
    criticasDegradadasMit,
    amenazasSinBarrera,
    consecuenciasSinBarrera,
  };
}

/**
 * Compara los KPIs calculados en JS contra los valores crudos de la hoja Resumen_Riesgo
 * (si existe), para detectar discrepancias. Es solo informativo/opcional.
 */
function compararConResumenRiesgo(kpis, resumenRiesgoRows) {
  // La hoja Resumen_Riesgo en este proyecto tiene formato libre (etiqueta + valor en columnas
  // fijas), no tabular estándar; se deja como stub para validación manual futura si se requiere.
  return { comparado: false, motivo: 'Formato de Resumen_Riesgo no tabular; comparación manual.' };
}

window.BowtieKpiCalculator = { calcularKpis, compararConResumenRiesgo };
