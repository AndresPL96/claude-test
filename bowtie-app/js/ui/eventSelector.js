/* Selector (dropdown) de Evento Tope: llena las opciones y notifica el cambio de selección. */
function wireEventSelector(selectEl, eventos, onSelect) {
  selectEl.innerHTML = '';
  eventos.forEach((ev) => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = `${ev.id} — ${ev.nombre || '(sin nombre)'}`;
    selectEl.appendChild(opt);
  });

  selectEl.onchange = () => {
    const evento = eventos.find((e) => e.id === selectEl.value);
    if (evento) onSelect(evento);
  };

  if (eventos.length > 0) {
    selectEl.value = eventos[0].id;
    onSelect(eventos[0]);
  }
}

window.BowtieEventSelector = { wireEventSelector };
