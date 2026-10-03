#!/usr/bin/env python3
"""Convierte un PDF "USO DE AULAS" de SharePoint al esquema back/data/<ID>.json.

Uso manual (ver consumos/sharepoint/README.md para el porqué es manual):
    python3 parse_pdf.py <ruta.pdf> <AULA_ID> > back/data/<AULA_ID>.json

El PDF tiene una tabla por página: 7 días x 2 sub-columnas (hora inicio /
hora fin) cada uno, con filas alternando "hora" y "contenido de la clase".
Sábado y, a veces, otros días tienen clases de más de una hora que no
calzan con la grilla de una hora usada por el resto de columnas; eso hace
que pdfplumber reparta el mismo bloque de texto en varias filas/posiciones
distintas (a veces donde se esperaría una hora, a veces en una fila extra
sin hora). Por eso NO asumimos una fila de contenido fija por hora: en vez
de eso, mapeamos cada aparición de texto a la "hora canónica" más cercana
(la última fila-de-hora válida vista en esa posición de la tabla, por
índice de fila global) y fusionamos apariciones consecutivas con el mismo
texto en bloques contiguos.
"""
import json
import re
import sys
from bisect import bisect_right
from collections import Counter

import pdfplumber

DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
TIME_RE = re.compile(r'^\d{1,2}:\d{2} (AM|PM)$')
NIVEL_RE = re.compile(r'^NIVEL:\s*(.+?)\s*NIVEL$', re.IGNORECASE)


def hora_a_24h(hora12):
    """'7:30 AM' -> '07:30', '12:29 PM' -> '12:29', '1:29 PM' -> '13:29'."""
    m = re.match(r'^(\d{1,2}):(\d{2}) (AM|PM)$', hora12)
    h, mins, ampm = int(m.group(1)), m.group(2), m.group(3)
    if ampm == 'AM':
        h = 0 if h == 12 else h
    else:
        h = 12 if h == 12 else h + 12
    return f'{h:02d}:{mins}'


CAPACIDAD_RE = re.compile(r'CAPACIDAD:\s*(\d+)')


def extraer_capacidad(ruta_pdf):
    with pdfplumber.open(ruta_pdf) as pdf:
        texto = pdf.pages[0].extract_text() or ''
    m = CAPACIDAD_RE.search(texto)
    return int(m.group(1)) if m else None


def extraer_filas(ruta_pdf):
    """Todas las filas de la tabla principal (14 columnas) de todas las páginas."""
    filas = []
    with pdfplumber.open(ruta_pdf) as pdf:
        for pagina in pdf.pages:
            tablas = [t for t in pagina.find_tables() if len(t.rows) and len(t.rows[0].cells) == 14]
            if not tablas:
                continue
            # Si hay más de una (no debería), usamos la de más filas.
            tabla = max(tablas, key=lambda t: len(t.rows))
            for fila in tabla.extract():
                if fila and fila[0] in ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'):
                    continue  # encabezado de nombres de día, no aporta datos
                filas.append(fila)
    return filas


def es_par_hora(izq, der):
    return bool(izq and der and TIME_RE.match(izq) and TIME_RE.match(der))


def construir_slots_canonicos(filas):
    """Lista de (indice_fila, horaInicio24, horaFin24) por cada fila que la
    mayoría de columnas reconoce como fila de hora."""
    slots = []
    for i, fila in enumerate(filas):
        pares_validos = []
        for d in range(7):
            izq, der = fila[2 * d], fila[2 * d + 1]
            if es_par_hora(izq, der):
                pares_validos.append((izq, der))
        if len(pares_validos) >= 4:
            (izq, der), _ = Counter(pares_validos).most_common(1)[0]
            slots.append((i, hora_a_24h(izq), hora_a_24h(der)))
    return slots


def parsear_texto_bloque(texto):
    """'CARRERA\\nMATERIA\\nDOCENTE - MODALIDAD\\nNIVEL: X NIVEL\\nPARALELO Y'
    -> dict o None si no tiene la forma esperada (se reporta aparte)."""
    lineas = [l.strip() for l in texto.split('\n') if l.strip()]
    if len(lineas) < 4:
        return None
    paralelo_linea = lineas[-1]
    nivel_linea = lineas[-2]
    docente_linea = lineas[-3]
    materia = lineas[-4]
    carrera = ' '.join(lineas[:-4]).strip() or materia

    if not paralelo_linea.upper().startswith('PARALELO'):
        return None
    paralelo = paralelo_linea.split(None, 1)[1].strip() if len(paralelo_linea.split(None, 1)) > 1 else ''

    m = NIVEL_RE.match(nivel_linea)
    if not m:
        return None
    nivel = m.group(1).strip()

    docente = docente_linea.rsplit(' - ', 1)[0].strip()
    if docente.lower() == 'null' or not docente:
        docente = 'POR DEFINIR'

    return {
        'materia': materia,
        'docente': docente,
        'carrera': carrera,
        'nivel': nivel,
        'paralelo': paralelo,
    }


def extraer_bloques(filas, slots_canonicos, aula_id):
    slot_filas = [s[0] for s in slots_canonicos]
    bloques_por_dia = {d: [] for d in range(7)}  # (slot_inicio, slot_fin, texto)
    advertencias = []

    for i, fila in enumerate(filas):
        slot_idx = bisect_right(slot_filas, i) - 1
        if slot_idx < 0:
            continue  # contenido antes de la primera hora reconocida en la página
        for d in range(7):
            izq, der = fila[2 * d], fila[2 * d + 1]
            if es_par_hora(izq, der):
                continue  # es una fila de hora para esta columna, no contenido
            texto = (izq or '').strip()
            if not texto:
                continue
            bloques_dia = bloques_por_dia[d]
            if bloques_dia and bloques_dia[-1][2] == texto and slot_idx - bloques_dia[-1][1] <= 1:
                # Mismo texto, mismo slot o el inmediato siguiente: es el
                # mismo bloque repetido/extendido por el desalineo de grilla.
                inicio, _, t = bloques_dia[-1]
                bloques_dia[-1] = (inicio, slot_idx, t)
            elif bloques_dia and bloques_dia[-1][1] == slot_idx and bloques_dia[-1][2] != texto:
                # Varias sesiones (ej. semipresenciales) comparten la misma
                # hora nominal sin que el PDF indique una subdivisión real.
                # Igual que se decidió para A4: se conserva solo la primera
                # y se deja constancia para revisión manual.
                advertencias.append(
                    f'Aula {aula_id}, día {DIAS[d]}, slot {slot_idx}: dos sesiones comparten la misma hora, '
                    f'se conserva solo la primera ("{bloques_dia[-1][2][:40]}...", se descarta "{texto[:40]}...").'
                )
            else:
                bloques_dia.append((slot_idx, slot_idx, texto))

    resultado = []
    for d in range(7):
        dia = DIAS[d]
        if dia == 'domingo':
            if bloques_por_dia[d]:
                advertencias.append(f'Aula {aula_id}: domingo tiene contenido y se está descartando (revisar a mano).')
            continue
        for slot_inicio, slot_fin, texto in bloques_por_dia[d]:
            datos = parsear_texto_bloque(texto)
            if datos is None:
                advertencias.append(f'Aula {aula_id}, día {dia}: no se pudo interpretar el bloque: {texto!r}')
                continue
            resultado.append({
                'dia': dia,
                'horaInicio': slots_canonicos[slot_inicio][1],
                'horaFin': slots_canonicos[slot_fin][2],
                **datos,
            })

    return resultado, advertencias


def main():
    if len(sys.argv) != 3:
        print('Uso: parse_pdf.py <ruta.pdf> <AULA_ID>', file=sys.stderr)
        sys.exit(1)
    ruta_pdf, aula_id = sys.argv[1], sys.argv[2].upper()

    filas = extraer_filas(ruta_pdf)
    slots = construir_slots_canonicos(filas)
    bloques, advertencias = extraer_bloques(filas, slots, aula_id)

    # Algunas aulas (ej. A1) tienen una celda (normalmente sábado) con tantas
    # sesiones apiladas que el PDF reparte una misma fila lógica en varias
    # páginas, repitiendo en cada una el contenido de las columnas más
    # cortas (lunes-viernes). Eso produce bloques exactamente duplicados
    # (mismo día/hora/materia/docente/nivel/paralelo) que no son clases
    # reales adicionales — se colapsan a uno solo.
    vistos = set()
    sin_duplicados = []
    for b in bloques:
        clave = tuple(b[k] for k in ('dia', 'horaInicio', 'horaFin', 'materia', 'docente', 'carrera', 'nivel', 'paralelo'))
        if clave in vistos:
            continue
        vistos.add(clave)
        sin_duplicados.append(b)
    bloques = sin_duplicados

    # En aulas con sábados muy densos (varias sesiones semipresenciales
    # apiladas en la misma celda), la tabla del PDF a veces reparte una
    # misma fila lógica en páginas con desalineos distintos y terminamos con
    # bloques que SÍ se solapan en hora aunque no sean duplicados exactos.
    # No hay forma de recuperar la subdivisión real desde el PDF, así que
    # igual que se decidió para A4 ante ambigüedad: se conserva la primera
    # sesión encontrada (en el orden en que aparece en el documento) y se
    # descarta cualquier otra que se solape con una ya aceptada.
    aceptados_por_dia = {}
    bloques_sin_solape = []
    for b in bloques:
        aceptados = aceptados_por_dia.setdefault(b['dia'], [])
        se_solapa = any(b['horaInicio'] < a['horaFin'] and a['horaInicio'] < b['horaFin'] for a in aceptados)
        if se_solapa:
            advertencias.append(
                f"Aula {aula_id}, día {b['dia']}: \"{b['materia']}\" ({b['horaInicio']}-{b['horaFin']}) se "
                'solapa con una sesión ya aceptada y se descarta; revisar el PDF a mano para ese día.'
            )
            continue
        aceptados.append(b)
        bloques_sin_solape.append(b)
    bloques = bloques_sin_solape

    bloques.sort(key=lambda b: (DIAS.index(b['dia']), b['horaInicio']))

    for a in advertencias:
        print('ADVERTENCIA:', a, file=sys.stderr)

    salida = {
        'aula': aula_id,
        'campus': 'Manuela Sáenz',
        'capacidad': extraer_capacidad(ruta_pdf),
        'bloques': bloques,
    }
    print(json.dumps(salida, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
