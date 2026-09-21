/*
 * Estilos visuales de Cytoscape. Los nodos usan las imágenes PNG de assets/icons/ como
 * background-image; el texto se superpone como label centrado sobre la imagen.
 */
const ICONS = 'assets/icons/';

function bowtieStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        'background-fit': 'cover',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 10,
        'text-wrap': 'wrap',
        'text-max-width': '90px',
        color: '#1a1a1a',
        'font-family': 'system-ui, sans-serif',
      },
    },
    {
      selector: '.evento-node',
      style: {
        'background-image': `${ICONS}evento_tope.png`,
        width: 140,
        height: 140,
        label: 'data(label)',
        'font-size': 12,
        'font-weight': 'bold',
        'text-max-width': '110px',
      },
    },
    {
      selector: '.peligro-node',
      style: {
        'background-image': `${ICONS}peligro.png`,
        width: 90,
        height: 90,
        label: 'data(label)',
        'font-size': 10,
      },
    },
    {
      selector: '.amenaza-node',
      style: {
        'background-image': `${ICONS}amenaza.png`,
        width: 130,
        height: 70,
        shape: 'round-rectangle',
        label: 'data(label)',
      },
    },
    {
      selector: '.consecuencia-node',
      style: {
        'background-image': `${ICONS}consecuencia.png`,
        width: 130,
        height: 70,
        shape: 'round-rectangle',
        label: 'data(label)',
      },
    },
    {
      selector: '.barrera-node',
      style: {
        width: 120,
        height: 60,
        shape: 'round-rectangle',
        label: 'data(label)',
        'font-size': 9,
        'text-max-width': '100px',
      },
    },
    { selector: '.semaforo-verde', style: { 'background-image': `${ICONS}barrera_efectiva.png` } },
    { selector: '.semaforo-amarillo', style: { 'background-image': `${ICONS}barrera_degradada.png` } },
    { selector: '.semaforo-naranja', style: { 'background-image': `${ICONS}barrera_degradada.png` } },
    { selector: '.semaforo-rojo', style: { 'background-image': `${ICONS}barrera_fallida.png` } },
    { selector: '.semaforo-sin_datos', style: { 'background-image': `${ICONS}barrera_sin_datos.png` } },

    {
      selector: '.toggle-node',
      style: {
        width: 22,
        height: 22,
        label: '',
      },
    },
    { selector: '.toggle-collapsed', style: { 'background-image': `${ICONS}boton_mas.png` } },
    { selector: '.toggle-expanded', style: { 'background-image': `${ICONS}boton_menos.png` } },

    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#999',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#999',
        'curve-style': 'straight',
      },
    },
    { selector: '.edge-peligro', style: { 'line-style': 'solid', 'target-arrow-shape': 'none' } },
    { selector: '.edge-barrera', style: { 'line-style': 'solid' } },
    { selector: '.edge-directa', style: { 'line-style': 'solid' } },
    {
      selector: '.edge-sin-barrera',
      style: { 'line-style': 'dashed', 'line-color': '#c0392b', 'target-arrow-color': '#c0392b' },
    },
  ];
}

window.BowtieCytoscapeStyles = { bowtieStylesheet };
