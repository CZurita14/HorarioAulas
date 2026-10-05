export interface RegistroHorario {
  docente?: string;
  dia?: string;
  hora_inicio?: string;
  hora_fin?: string;
  asignatura?: string;
  aula?: string;
  evidencia?: string;
  pagina?: number;
}

export interface RegistroAfectado {
  docente: string;
  curso: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
  evidencia: string;
}

export interface Conflicto {
  tipo: 'DOCENTE' | 'AULA' | 'DOCENTE_AULA' | 'HORARIO_NO_PERMITIDO';
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  curso?: string;
  aula?: string;
  regla: string;
  registros_afectados: RegistroAfectado[];
}

export interface ResultadoJSON {
  case_id: string;
  procesamiento: {
    estado: string;
    origen_datos: string;
    fecha_corte?: string;
    version_agente: string;
    version_prompt: string;
    version_reglas: string;
  };
  periodo: string;
  facultad?: string;
  docente?: string;
  estado: 'SIN_CRUCE' | 'CRUCE_DOCENTE' | 'CRUCE_AULA' | 'CRUCE_DOCENTE_AULA' | 'HORARIO_NO_PERMITIDO_10_10_30' | 'DATO_FALTANTE' | 'NO_APLICA';
  resumen: string;
  conflictos: Conflicto[];
  faltantes: string[];
  evidencia: string[];
  enrutamiento: {
    destino: string;
    regla: string;
  };
}

export interface SaludResponse {
  api: string;
  core: string;
  sga_conectado: boolean;
  sga_origen: string;
  llm_provider: string;
  llm_status: string;
  version_reglas: string;
  version_agente: string;
}

export interface ConfiguracionReglas {
  version: string;
  descripcion: string;
  franja_no_permitida: {
    activa: boolean;
    inicio: string;
    fin: string;
    codigo_regla: string;
  };
}

const API_BASE = 'http://localhost:8000';

export async function uploadDocumento(file: File, periodo: string = 'A26', facultad?: string): Promise<ResultadoJSON> {
  const formData = new FormData();
  formData.append('file', file);
  
  let url = `${API_BASE}/api/v1/casos/upload?periodo=${encodeURIComponent(periodo)}`;
  if (facultad) {
    url += `&facultad=${encodeURIComponent(facultad)}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error en servidor' }));
    throw new Error(errorData.detail || 'Error al procesar el documento');
  }

  return response.json();
}

export async function validarCasoPayload(caseId: string, registros: RegistroHorario[], esNoAplica: boolean = false): Promise<ResultadoJSON> {
  const response = await fetch(`${API_BASE}/api/v1/casos/validar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      case_id: caseId,
      periodo: 'A26',
      facultad: 'Facultad de Ingeniería',
      es_no_aplica: esNoAplica,
      registros: registros,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al validar el caso');
  }

  return response.json();
}

export async function getHistorialCasos(): Promise<ResultadoJSON[]> {
  const response = await fetch(`${API_BASE}/api/v1/casos`);
  if (!response.ok) {
    throw new Error('Error al obtener el historial');
  }
  return response.json();
}

export async function getSaludSistema(): Promise<SaludResponse> {
  const response = await fetch(`${API_BASE}/salud`);
  if (!response.ok) {
    throw new Error('Error al consultar estado del sistema');
  }
  return response.json();
}

export async function getConfiguracionReglas(): Promise<ConfiguracionReglas> {
  const response = await fetch(`${API_BASE}/api/v1/configuracion/reglas`);
  if (!response.ok) {
    throw new Error('Error al obtener configuración de reglas');
  }
  return response.json();
}

export async function updateConfiguracionReglas(nuevaConfig: ConfiguracionReglas): Promise<any> {
  const response = await fetch(`${API_BASE}/api/v1/configuracion/reglas`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(nuevaConfig),
  });

  if (!response.ok) {
    throw new Error('Error al guardar la nueva configuración');
  }

  return response.json();
}
