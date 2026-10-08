import { DatosAula } from './aulaService';

export interface PreviewResultado {
  datos: DatosAula;
  advertencias: string[];
}

async function parsearErrorApi(resp: Response): Promise<string> {
  try {
    const body = await resp.json();
    return body.detalle ? `${body.error}\n\n${body.detalle}` : body.error || `Error ${resp.status}`;
  } catch {
    return `Error ${resp.status}`;
  }
}

export async function login(usuario: string, password: string): Promise<void> {
  const resp = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ usuario, password }),
  });
  if (!resp.ok) throw new Error(await parsearErrorApi(resp));
}

export async function logout(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
}

export async function sesionActiva(): Promise<string | null> {
  const resp = await fetch('/api/admin/me', { credentials: 'include' });
  if (!resp.ok) return null;
  const body = await resp.json();
  return body.usuario ?? null;
}

export interface AulaConCampus {
  aula: string;
  campus: string;
}

export async function obtenerAulasConCampus(): Promise<AulaConCampus[]> {
  const resp = await fetch('/api/admin/aulas', { credentials: 'include' });
  if (!resp.ok) return [];
  return resp.json();
}

export async function previsualizarPdf(aula: string, archivo: File): Promise<PreviewResultado> {
  const form = new FormData();
  form.append('aula', aula);
  form.append('pdf', archivo);
  const resp = await fetch('/api/admin/preview', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!resp.ok) throw new Error(await parsearErrorApi(resp));
  return resp.json();
}

export async function publicarAula(aula: string, datos: DatosAula): Promise<void> {
  const resp = await fetch('/api/admin/publicar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ aula, datos }),
  });
  if (!resp.ok) throw new Error(await parsearErrorApi(resp));
}
