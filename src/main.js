import { obtenerDatosAula } from './data.js';
import { obtenerDiaActual } from './schedule.js';
import { renderVistaPrincipal, renderVistaCompleta } from './render.js';
import './styles.css';

const app = document.getElementById('app');
const datosAula = obtenerDatosAula();

let vista = 'principal';
let diaSeleccionado = obtenerDiaActual();

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
setInterval(() => {
  if (vista === 'principal') render();
}, 60000);
