/*
 * Estilos visuales de Cytoscape. Los nodos usan las imágenes PNG de assets/icons/ como
 * background-image; el texto se superpone como label centrado sobre la imagen.
 *
 * Geometría medida sobre los PNG (necesaria para que texto y líneas caigan donde deben):
 *  - amenaza/consecuencia/peligro (410x298): recuadro blanco interior en y 0.074..0.755
 *    (centro 0.414, no 0.5) y x 0.06..0.94.
 *  - barrera (380x353): barra de color en y 0..0.414 y x 0.42..0.58; caja blanca debajo.
 *
 * Conexiones: las aristas terminan en el CENTRO del nodo ('inside-to-node') y los nodos se
 * dibujan por encima de las aristas, así la línea entra "por detrás" del ícono en vez de
 * morir en el borde de la caja invisible. En las barreras el centro del nodo coincide con
 * el centro de la barra de color (por eso el nodo es más alto que el ícono y éste se ancla
 * al fondo), replicando el trazo de BowTie XP: una vía continua con las barreras encima.
 */
const ICONS = 'assets/icons/';

const BARRERA_W = 130;
const BARRERA_H = 192; // el centro cae sobre la barra de color, no sobre la caja blanca
const CAJA_W = 160;
const CAJA_H = 116;

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
        'font-size': 10,
        'text-wrap': 'wrap',
        color: '#111827',
        'font-family': 'system-ui, "Segoe UI", sans-serif',
        'z-index': 10,
      },
    },
    {
      selector: '.evento-node',
      style: {
        'background-image': `${ICONS}evento_tope.png`,
        width: 150,
        height: 150,
        label: 'data(label)',
        'text-max-width': '92px',
        'font-weight': 'bold',
      },
    },
    {
      selector: '.peligro-node',
      style: {
        'background-image': `${ICONS}peligro.png`,
        width: 150,
        height: 109,
        label: 'data(label)',
        'text-max-width': '120px',
        'text-margin-y': -9,
        'font-weight': 'bold',
      },
    },
    {
      selector: '.amenaza-node',
      style: {
        'background-image': `${ICONS}amenaza.png`,
        width: CAJA_W,
        height: CAJA_H,
        shape: 'round-rectangle',
        label: 'data(label)',
        'text-max-width': '128px',
        'text-margin-y': -10,
      },
    },
    {
      selector: '.consecuencia-node',
      style: {
        'background-image': `${ICONS}consecuencia.png`,
        width: CAJA_W,
        height: CAJA_H,
        shape: 'round-rectangle',
        label: 'data(label)',
        'text-max-width': '128px',
        'text-margin-y': -10,
      },
    },
    {
      selector: '.barrera-node',
      style: {
        width: BARRERA_W,
        height: BARRERA_H,
        // Rectángulo, no redondeado: con background-clip 'node' las esquinas redondeadas del
        // nodo recortaban las esquinas inferiores del ícono, que está anclado al fondo.
        shape: 'rectangle',
        label: 'data(label)',
        'font-size': 9,
        'text-max-width': '112px',
        'text-margin-y': 60, // centra el texto en la caja blanca, que cuelga bajo la barra
        'background-fit': 'contain',
        'background-clip': 'node',
        'background-position-x': '50%',
        'background-position-y': '100%',
      },
    },
    { selector: '.semaforo-verde', style: { 'background-image': `${ICONS}barrera_efectiva.png` } },
    { selector: '.semaforo-amarillo', style: { 'background-image': `${ICONS}barrera_degradada.png` } },
    { selector: '.semaforo-rojo', style: { 'background-image': `${ICONS}barrera_fallida.png` } },
    {
      selector: '.semaforo-sin_datos',
      style: { 'background-image': `${ICONS}barrera_sin_datos.png` },
    },

    {
      // Factor de escalamiento: caja amarilla (misma geometría que la de amenaza) al inicio
      // de una sub-rama que remonta hasta la barrera que degrada.
      selector: '.factor-node',
      style: {
        'background-image': `${ICONS}factor_escalamiento.png`,
        width: CAJA_W,
        height: CAJA_H,
        shape: 'round-rectangle',
        label: 'data(label)',
        'font-size': 9,
        'text-max-width': '128px',
        'text-margin-y': -10,
      },
    },
    {
      selector: '.toggle-node',
      style: {
        width: 16,
        height: 16,
        label: '',
        'z-index': 30,
      },
    },
    {
      // Vértices invisibles del tronco vertical: solo sirven para quebrar el trazo en ángulo
      // recto, no deben verse ni capturar el puntero.
      selector: '.junction-node',
      style: { width: 1, height: 1, label: '', events: 'no', 'background-opacity': 0 },
    },
    { selector: '.toggle-collapsed', style: { 'background-image': `${ICONS}boton_mas.png` } },
    { selector: '.toggle-expanded', style: { 'background-image': `${ICONS}boton_menos.png` } },

    {
      selector: 'edge',
      style: {
        width: 1.6,
        'line-color': '#6b7280',
        'target-arrow-shape': 'none',
        'source-arrow-shape': 'none',
        'curve-style': 'straight',
        'source-endpoint': 'inside-to-node',
        'target-endpoint': 'inside-to-node',
        'z-index': 1,
      },
    },
    {
      selector: '.edge-sin-barrera',
      style: { 'line-style': 'dashed', 'line-color': '#c0392b' },
    },

    {
      selector: 'edge.hl',
      style: { width: 3.2, 'line-color': '#1d4ed8', 'z-index': 5 },
    },
    {
      selector: 'node.hl',
      style: { color: '#1d4ed8', 'font-weight': 'bold' },
    },
  ];
}

window.BowtieCytoscapeStyles = { bowtieStylesheet };
