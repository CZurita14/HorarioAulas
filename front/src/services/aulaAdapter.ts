import { DatosAula } from './aulaService';
import { ResultadoJSON } from './api';
import { DIAS_LABORABLES_LABEL, DiaSemana } from './scheduleUtils';

export function convertirAulaAResultadoJSON(datosAula: DatosAula): ResultadoJSON {
  const evidencias = datosAula.bloques.map((b) => {
    const diaLabel = DIAS_LABORABLES_LABEL[b.dia as DiaSemana] || b.dia;
    return `${diaLabel} ${b.horaInicio} – ${b.horaFin} ${b.docente} ${b.materia} AULA ${datosAula.aula}`;
  });

  return {
    case_id: `AULA-${datosAula.aula}`,
    procesamiento: {
      estado: 'COMPLETADO',
      origen_datos: `Horario Oficial Campus ${datosAula.campus}`,
      version_agente: 'v1.0-UTI',
      version_prompt: 'HorariosAulas-2026',
      version_reglas: '1.0',
    },
    periodo: '2026-A26',
    facultad: 'Universidad Tecnológica Indoamérica',
    docente: `Aula ${datosAula.aula} (Capacidad: ${datosAula.capacidad} est.)`,
    estado: 'SIN_CRUCE',
    resumen: `Horario académico consolidado para el Aula ${datosAula.aula} en Campus ${datosAula.campus} con capacidad para ${datosAula.capacidad} estudiantes.`,
    conflictos: [],
    faltantes: [],
    evidencia: evidencias,
    enrutamiento: {
      destino: 'CONSULTA_PUBLICA_AULAS',
      regla: 'HORARIO_VIGENTE',
    },
  };
}
