import { obtenerDatosAula } from './data.js';
import { obtenerDiaActual } from './schedule.js';
import { renderVistaPrincipal, renderVistaCompleta } from './render.js';
import './styles.css';

const app = document.getElementById('app');
const datosAula = obtenerDatosAula();

let vista = 'principal';
let diaSeleccionado = obtenerDiaActual();
// La vista completa no tiene chip para "domingo" (no es un día de clases);
// si hoy es domingo, el selector debe mostrar la semana que viene con
// "lunes" preseleccionado en lugar de un día inexistente.
if (diaSeleccionado === 'domingo') {
  diaSeleccionado = 'lunes';
}

function render() {
  if (vista === 'principal') {
    renderVistaPrincipal(app, datosAula);
    document.getElementById('btn-ver-completo').addEventListener('click', () => {
      vista = 'completa';
      render();
    });
  } else {
    renderVistaCompleta(app, datosAula, diaSeleccionado);
    document.getElementById('btn-volver').addEventListener('click', () => {
      vista = 'principal';
      render();
    });
    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        diaSeleccionado = chip.dataset.dia;
        render();
      });
    });
  }
}

render();

// Alinea las re-renderizaciones periódicas a los límites reales del minuto
// (en vez de contar 60s desde la carga de la página) y reprograma con
// setTimeout de forma recursiva para evitar el drift de setInterval.
function programarSiguienteTick() {
  const retraso = 60000 - (Date.now() % 60000);
  setTimeout(() => {
    if (vista === 'principal') render();
    programarSiguienteTick();
  }, retraso);
}
programarSiguienteTick();

// Los navegadores móviles pausan/throttlean los timers cuando la pestaña
// está en segundo plano o la pantalla se bloquea. Al volver, forzamos un
// re-render inmediato para que el reloj y la clase actual no queden
// desactualizados hasta el siguiente tick.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && vista === 'principal') render();
});
window.addEventListener('pageshow', () => {
  if (vista === 'principal') render();
});
