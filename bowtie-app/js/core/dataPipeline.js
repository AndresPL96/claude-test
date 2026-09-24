/*
 * Orquesta validator + dataModel: limpia cada hoja, filtra FKs huérfanas en cascada
 * (Evento -> Amenaza/Consecuencia -> Barrera -> Factor -> Control) y construye el modelo final.
 */
function runBowtiePipeline(sheets) {
  const V = window.BowtieDataValidator;
  const report = new V.ValidationReport();

  // 1) Limpieza por hoja (campos obligatorios + PK + duplicados)
  const eventos = V.cleanSheetRows(
    'Eventos_Tope',
    sheets.Eventos_Tope,
    'ID_Evento',
    ['Nombre_Evento', 'Peligro', 'Proceso_Area'],
    report
  );
  const eventoIds = new Set(eventos.map((e) => e.ID_Evento));

  let amenazas = V.cleanSheetRows(
    'Amenazas',
    sheets.Amenazas,
    'ID_Amenaza',
    ['ID_Evento', 'Nombre_Amenaza'],
    report
  );
  amenazas = V.filterOrphans('Amenazas', amenazas, 'ID_Evento', eventoIds, report, 'Eventos_Tope');
  const amenazaIds = new Set(amenazas.map((a) => a.ID_Amenaza));

  let consecuencias = V.cleanSheetRows(
    'Consecuencias',
    sheets.Consecuencias,
    'ID_Consecuencia',
    ['ID_Evento', 'Nombre_Consecuencia', 'Severidad_1a5'],
    report
  );
  consecuencias = V.filterOrphans('Consecuencias', consecuencias, 'ID_Evento', eventoIds, report, 'Eventos_Tope');
  V.validateRange('Consecuencias', consecuencias, 'Severidad_1a5', 1, 5, report, 'ID_Consecuencia');
  const consecuenciaIds = new Set(consecuencias.map((c) => c.ID_Consecuencia));

  let barrerasPrev = V.cleanSheetRows(
    'Barreras_Preventivas',
    sheets.Barreras_Preventivas,
    'ID_Barrera',
    ['ID_Amenaza', 'Nombre_Barrera', 'Criticidad', 'Estado'],
    report
  );
  barrerasPrev = V.filterOrphans('Barreras_Preventivas', barrerasPrev, 'ID_Amenaza', amenazaIds, report, 'Amenazas');
  const barreraPrevIds = new Set(barrerasPrev.map((b) => b.ID_Barrera));

  let barrerasMit = V.cleanSheetRows(
    'Barreras_Mitigadoras',
    sheets.Barreras_Mitigadoras,
    'ID_Barrera',
    ['ID_Consecuencia', 'Nombre_Barrera', 'Criticidad', 'Estado'],
    report
  );
  barrerasMit = V.filterOrphans('Barreras_Mitigadoras', barrerasMit, 'ID_Consecuencia', consecuenciaIds, report, 'Consecuencias');
  const barreraMitIds = new Set(barrerasMit.map((b) => b.ID_Barrera));

  let factores = V.cleanSheetRows(
    'Factores_Escalamiento',
    sheets.Factores_Escalamiento,
    'ID_Factor',
    ['ID_Barrera', 'Hoja_Barrera', 'Nombre_Factor'],
    report
  );
  factores = factores.filter((f) => {
    const validSheet = f.Hoja_Barrera === 'Barreras_Preventivas' || f.Hoja_Barrera === 'Barreras_Mitigadoras';
    if (!validSheet) {
      report.add('Factores_Escalamiento', f.__rowNumber, f.ID_Factor, 'HOJA_BARRERA_INVALIDA', `Hoja_Barrera "${f.Hoja_Barrera}" inválida: fila omitida.`);
      return false;
    }
    const validIds = f.Hoja_Barrera === 'Barreras_Preventivas' ? barreraPrevIds : barreraMitIds;
    if (!validIds.has(f.ID_Barrera)) {
      report.add('Factores_Escalamiento', f.__rowNumber, f.ID_Factor, 'FK_HUERFANA', `ID_Barrera "${f.ID_Barrera}" no existe en ${f.Hoja_Barrera}: fila omitida.`);
      return false;
    }
    return true;
  });
  const factorIds = new Set(factores.map((f) => f.ID_Factor));

  let controles = V.cleanSheetRows(
    'Controles_Escalamiento',
    sheets.Controles_Escalamiento,
    'ID_Control',
    ['ID_Factor', 'Nombre_Control'],
    report
  );
  controles = V.filterOrphans('Controles_Escalamiento', controles, 'ID_Factor', factorIds, report, 'Factores_Escalamiento');
  V.validateRange('Controles_Escalamiento', controles, 'Efectividad_Pct', 0, 100, report, 'ID_Control');

  const clean = {
    Eventos_Tope: eventos,
    Amenazas: amenazas,
    Consecuencias: consecuencias,
    Barreras_Preventivas: barrerasPrev,
    Barreras_Mitigadoras: barrerasMit,
    Factores_Escalamiento: factores,
    Controles_Escalamiento: controles,
  };

  const modelo = window.BowtieDataModel.buildBowtieModel(clean);
  const kpis = window.BowtieKpiCalculator.calcularKpis(clean);

  return { modelo, report, kpis, clean };
}

window.BowtieDataPipeline = { runBowtiePipeline };
