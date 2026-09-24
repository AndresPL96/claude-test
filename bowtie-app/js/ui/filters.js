/*
 * Filtro por Proceso_Area: reduce la lista de Eventos Tope disponibles en el selector.
 * Filtro por Semáforo: no elimina nodos (rompería la estructura del BowTie), atenúa
 * (opacidad reducida) las barreras cuyo semáforo no coincide con el filtro activo.
 */
function wireProcesoAreaFilter(selectEl, eventos, onFilterChange) {
  const areas = Array.from(new Set(eventos.map((e) => e.procesoArea).filter(Boolean))).sort();
  selectEl.innerHTML = '<option value="">Todos los procesos/áreas</option>';
  areas.forEach((area) => {
    const opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    selectEl.appendChild(opt);
  });
  selectEl.onchange = () => {
    const area = selectEl.value;
    const filtrados = area ? eventos.filter((e) => e.procesoArea === area) : eventos;
    onFilterChange(filtrados);
  };
}

function wireSemaforoFilter(selectEl, renderer) {
  const ESTADOS = ['VERDE', 'AMARILLO', 'ROJO', 'SIN_DATOS'];
  selectEl.innerHTML = '<option value="">Todos los semáforos</option>';
  ESTADOS.forEach((estado) => {
    const opt = document.createElement('option');
    opt.value = estado;
    opt.textContent = estado;
    selectEl.appendChild(opt);
  });
  selectEl.onchange = () => renderer.setSemaforoFilter(selectEl.value);
}

window.BowtieFilters = { wireProcesoAreaFilter, wireSemaforoFilter };
