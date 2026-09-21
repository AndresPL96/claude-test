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
        'background-fit': 'contain',
        'background-clip': 'none',
        'background-opacity': 0,
        'border-width': 0,
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 8,
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
        'font-size': 10,
        'font-weight': 'bold',
        'text-max-width': '100px',
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
        // El nodo en sí es angosto (ancho de la "barra" del ícono) para que la línea del
        // BowTie se corte justo donde empieza el ícono y lo atraviese visualmente; el
        // ícono completo (barra + caja) se dibuja sin recorte ('background-clip: none')
        // por lo que la caja blanca sobresale del nodo hacia abajo.
        width: 30,
        height: 40,
        shape: 'round-rectangle',
        label: 'data(label)',
        'font-size': 7,
        'text-max-width': '95px',
        'text-margin-y': 51,
        'background-fit': 'none',
        'background-clip': 'none',
        'background-width': '110px',
        'background-height': '102px',
        'background-position-x': '50%',
        'background-position-y': '0%',
      },
    },
    { selector: '.semaforo-verde', style: { 'background-image': `${ICONS}barrera_efectiva.png` } },
    { selector: '.semaforo-amarillo', style: { 'background-image': `${ICONS}barrera_degradada.png` } },
    { selector: '.semaforo-naranja', style: { 'background-image': `${ICONS}barrera_degradada.png` } },
    { selector: '.semaforo-rojo', style: { 'background-image': `${ICONS}barrera_fallida.png` } },
    {
      selector: '.semaforo-sin_datos',
      style: {
        'background-image': `${ICONS}barrera_sin_datos.png`,
        'background-fit': 'contain',
        'background-width': '110px',
        'background-height': '61px',
        'background-position-y': '50%',
      },
    },

    {
      selector: '.toggle-node',
      style: {
        width: 14,
        height: 14,
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
        'target-arrow-shape': 'none',
        'source-arrow-shape': 'none',
        'curve-style': 'straight',
      },
    },
    { selector: '.edge-peligro', style: { 'line-style': 'solid' } },
    { selector: '.edge-barrera', style: { 'line-style': 'solid' } },
    { selector: '.edge-directa', style: { 'line-style': 'solid' } },
    {
      selector: '.edge-sin-barrera',
      style: { 'line-style': 'dashed', 'line-color': '#c0392b', 'target-arrow-color': '#c0392b' },
    },
  ];
}

window.BowtieCytoscapeStyles = { bowtieStylesheet };
