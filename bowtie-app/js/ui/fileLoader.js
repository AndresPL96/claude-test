/*
 * Botón "Cargar archivo": lee el .xlsx elegido, corre el pipeline de datos y entrega
 * el resultado ({ modelo, report, kpis }) al callback onLoaded.
 */
function wireFileLoader(inputEl, onLoaded, onError) {
  inputEl.addEventListener('change', async (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    try {
      const { sheets, missingSheets } = await window.BowtieExcelLoader.loadExcelFile(file);
      const resultado = window.BowtieDataPipeline.runBowtiePipeline(sheets);
      onLoaded({ ...resultado, missingSheets });
    } catch (err) {
      onError(err);
    } finally {
      inputEl.value = '';
    }
  });
}

window.BowtieFileLoader = { wireFileLoader };
