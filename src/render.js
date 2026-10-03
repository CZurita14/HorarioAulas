import {
  obtenerDiaActual,
  obtenerBloquesDia,
  obtenerClaseActual,
  obtenerClaseSiguiente,
  obtenerLunesDeLaSemana,
  obtenerSegmentosLlenos,
} from './schedule.js';

const TOTAL_SEGMENTOS = 14;

export function formatearDetalle(bloque) {
  return `${bloque.nivel}.º Nivel · ${bloque.carrera} · Paralelo ${bloque.paralelo}`;
}

export function formatearHora12(fecha) {
  let horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const sufijo = horas >= 12 ? 'pm' : 'am';
  horas = horas % 12 || 12;
  return `${horas.toString().padStart(2, '0')}:${minutos} ${sufijo}`;
}

export function renderBarraProgreso(bloque, minutosActuales) {
  const llenos = obtenerSegmentosLlenos(bloque, minutosActuales, TOTAL_SEGMENTOS);
  const segmentos = Array.from({ length: TOTAL_SEGMENTOS }, (_, i) =>
    `<div class="segmento ${i < llenos ? 'lleno' : ''}"></div>`
  ).join('');
  return `
    <div class="barra-progreso">${segmentos}</div>
    <div class="barra-horas">
      <span>${bloque.horaInicio}</span>
      <span>${bloque.horaFin}</span>
    </div>
  `;
}

export function renderVistaPrincipal(contenedor, datosAula, fecha = new Date()) {
  const dia = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = obtenerBloquesDia(datosAula.bloques, dia);
  const actual = obtenerClaseActual(bloquesDia, minutosActuales);
  const siguiente = obtenerClaseSiguiente(bloquesDia, minutosActuales);
  const restoDelDia = bloquesDia.filter((b) => b !== actual && b !== siguiente && b.horaInicio > (siguiente?.horaInicio ?? ''));

  const fechaTexto = fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  contenedor.innerHTML = `
    <header class="encabezado">
      <div class="encabezado-top">
        <span class="universidad">Universidad Indoamérica</span>
        <span class="reloj-vivo"><span class="punto-vivo"></span>${formatearHora12(fecha)}</span>
      </div>
      <h1>AULA ${datosAula.aula}</h1>
      <p class="campus">Campus ${datosAula.campus}</p>
      <p class="fecha">${fechaTexto}</p>
    </header>

    <div class="seccion-titulo">Ahora mismo en esta aula</div>

    <section class="tarjeta tarjeta-actual ${actual ? 'en-curso' : 'vacia'}">
      <h2>${actual ? 'CLASE EN CURSO' : 'SIN CLASES EN ESTE MOMENTO'}</h2>
      ${
        actual
          ? `<p class="materia">${actual.materia}</p>
             <p class="detalle">${formatearDetalle(actual)}</p>
             <p class="docente">Docente: ${actual.docente}</p>
             ${renderBarraProgreso(actual, minutosActuales)}`
          : ''
      }
    </section>

    ${
      siguiente
        ? `<section class="tarjeta tarjeta-siguiente">
            <div>
              <h2>SIGUIENTE</h2>
              <p class="materia-chica">${siguiente.materia}</p>
              <p class="docente">Docente: ${siguiente.docente}</p>
            </div>
            <span class="hora-chip">${siguiente.horaInicio}</span>
          </section>`
        : ''
    }

    ${
      restoDelDia.length
        ? `<div class="seccion-titulo">Resto del día de hoy</div>
           ${restoDelDia
             .map(
               (b) => `
             <div class="fila-resto">
               <div>
                 <p class="materia-chica">${b.materia}</p>
                 <p class="docente">${b.docente}</p>
               </div>
               <span class="hora-chica">${b.horaInicio}</span>
             </div>`
             )
             .join('')}`
        : ''
    }

    <button id="btn-ver-completo" class="boton-secundario">Ver horario completo de la semana</button>
  `;
}
