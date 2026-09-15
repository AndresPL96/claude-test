/*
 * Validación de PK/FK/rangos sobre las filas crudas leídas del Excel.
 * Política acordada:
 *  - Filas totalmente vacías: se ignoran en silencio (no son datos).
 *  - Fila con FK huérfana: se OMITE la fila (y lo que cuelgue de ella), con advertencia.
 *  - ID duplicado, campo obligatorio vacío, valor fuera de rango: advertencia, la fila
 *    SÍ se conserva salvo que el campo faltante sea la propia PK (ahí no hay forma de
 *    referenciarla, así que también se omite).
 *  - Amenaza/Consecuencia sin barreras: NO es un problema de validación, se maneja en dataModel.
 */

function isRowEmpty(row) {
  return Object.values(row).every((v) => v === null || v === undefined || v === '');
}

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

class ValidationReport {
  constructor() {
    this.issues = []; // { sheet, rowNumber, id, type, message }
  }
  add(sheet, rowNumber, id, type, message) {
    this.issues.push({ sheet, rowNumber, id, type, message });
  }
  get hasIssues() {
    return this.issues.length > 0;
  }
}

/**
 * Filtra filas vacías y valida campos obligatorios de una hoja genérica.
 * Devuelve { rows: [...filas válidas con rowNumber...], report }
 * requiredFields: columnas que no pueden estar vacías (además de la PK).
 * pkField: nombre de la columna PK.
 */
function cleanSheetRows(sheetName, rawRows, pkField, requiredFields, report) {
  const seenIds = new Set();
  const result = [];

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +2: encabezado en fila 1, datos desde fila 2
    if (isRowEmpty(row)) return;

    const id = row[pkField];
    if (isBlank(id)) {
      report.add(sheetName, rowNumber, null, 'PK_VACIA', `Fila sin ${pkField}: se omite.`);
      return;
    }

    if (seenIds.has(id)) {
      report.add(sheetName, rowNumber, id, 'ID_DUPLICADO', `${pkField} duplicado: "${id}".`);
    }
    seenIds.add(id);

    for (const field of requiredFields) {
      if (isBlank(row[field])) {
        report.add(sheetName, rowNumber, id, 'CAMPO_VACIO', `Campo obligatorio "${field}" vacío en ${id}.`);
      }
    }

    result.push({ ...row, __rowNumber: rowNumber });
  });

  return result;
}

/** Filtra filas cuya FK no exista en el conjunto de IDs válidos del padre. */
function filterOrphans(sheetName, rows, fkField, validParentIds, report, parentLabel) {
  return rows.filter((row) => {
    const fk = row[fkField];
    if (isBlank(fk) || !validParentIds.has(fk)) {
      report.add(
        sheetName,
        row.__rowNumber,
        row[Object.keys(row)[0]],
        'FK_HUERFANA',
        `${fkField} "${fk}" no existe en ${parentLabel}: fila omitida.`
      );
      return false;
    }
    return true;
  });
}

function validateRange(sheetName, rows, field, min, max, report, idField) {
  rows.forEach((row) => {
    const v = row[field];
    if (v === null || v === undefined || v === '') return;
    const num = Number(v);
    if (Number.isNaN(num) || num < min || num > max) {
      report.add(
        sheetName,
        row.__rowNumber,
        row[idField],
        'FUERA_DE_RANGO',
        `${field}="${v}" fuera de rango [${min}-${max}] en ${row[idField]}.`
      );
    }
  });
}

window.BowtieDataValidator = {
  ValidationReport,
  cleanSheetRows,
  filterOrphans,
  validateRange,
  isBlank,
};
