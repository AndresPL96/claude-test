/* Lee el archivo .xlsx con SheetJS y devuelve las filas crudas de cada hoja como arrays de objetos. */

const SHEET_NAMES = [
  'Eventos_Tope',
  'Amenazas',
  'Consecuencias',
  'Barreras_Preventivas',
  'Barreras_Mitigadoras',
  'Factores_Escalamiento',
  'Controles_Escalamiento',
  'Resumen_Riesgo',
];

function readSheetAsRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  // defval:null para conservar celdas vacías, raw:true para no perder tipos numéricos
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
}

/**
 * Carga un archivo .xlsx (File del input) y devuelve un objeto:
 * { sheets: { Eventos_Tope: [...], Amenazas: [...], ... }, missingSheets: [...] }
 */
function loadExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });

        const sheets = {};
        const missingSheets = [];
        for (const name of SHEET_NAMES) {
          if (workbook.SheetNames.includes(name)) {
            sheets[name] = readSheetAsRows(workbook, name);
          } else {
            sheets[name] = [];
            missingSheets.push(name);
          }
        }

        resolve({ sheets, missingSheets });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

window.BowtieExcelLoader = { loadExcelFile, SHEET_NAMES };
