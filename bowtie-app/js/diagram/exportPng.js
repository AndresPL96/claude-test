/* Exporta el diagrama actual de Cytoscape a PNG y dispara la descarga en el navegador. */
function exportDiagramToPng(cy, filename) {
  const dataUrl = cy.png({ full: true, scale: 2, bg: '#ffffff' });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || 'bowtie-diagrama.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.BowtieExportPng = { exportDiagramToPng };
