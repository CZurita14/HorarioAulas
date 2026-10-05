# 🎨 Plantilla UTI — Sistema de Diseño e Interfaz Institucional Reutilizable

Esta carpeta **`plantilla UTI`** contiene la plantilla oficial completa, ejecutable y reutilizable de la interfaz de usuario para la **Universidad Tecnológica Indoamérica (UTI)**.

Está lista para ser copiada a cualquier nuevo proyecto o utilizada por cualquier agente de IA.

---

## 📌 Estructura de Componentes Incluidos en `src/components/`

1. **[`Navbar.tsx`](src/components/Navbar.tsx):**  
   Encabezado institucional con el logotipo oficial `logo-uti.png`, selector de roles RBAC (`Administrador`, `Coordinador`, `Infraestructura`, `Decano`), switcher de tema claro/oscuro y botón de ajustes.

2. **[`UploadZone.tsx`](src/components/UploadZone.tsx):**  
   Zona de carga de archivos drag-and-drop (.pdf, .xlsx, .csv, .txt) con botones de prueba rápida para casos sintéticos.

3. **[`CaseDetail.tsx`](src/components/CaseDetail.tsx):**  
   Visor completo del dictamen del caso con badges institucionales por estado (`SIN_CRUCE`, `CRUCE_DOCENTE`, `CRUCE_AULA`, `CRUCE_DOCENTE_AULA`, `HORARIO_NO_PERMITIDO_10_10_30`, `DATO_FALTANTE`, `NO_APLICA`), citas de evidencia literal por fila e inspector del contrato JSON.

4. **[`ScheduleGrid.tsx`](src/components/ScheduleGrid.tsx):**  
   Matriz visual de cronograma semanal (Lunes a Sábado, 07:00 a 20:00) con resaltado gráfico de franjas horarias, marcado de cruces en rojo y franja prohibida `10:00–10:30` parametrizada.

5. **[`CaseHistoryTable.tsx`](src/components/CaseHistoryTable.tsx):**  
   Tabla de historial de casos auditados con filtrado y resaltado dinámico según el rol activo (RBAC - Sección 41 del SPEC).

6. **[`HealthStatusCard.tsx`](src/components/HealthStatusCard.tsx):**  
   Widget de monitoreo en tiempo real del estado de la API FastAPI, Core determinístico, SGA (Vivo vs Snapshot) y LLM Gateway.

7. **[`RulesConfigModal.tsx`](src/components/RulesConfigModal.tsx):**  
   Modal interactivo para ajustar dinámicamente la regla de la franja prohibida (inicio, fin, activa) sin modificar código.

---

## 🎨 Paleta de Colores Oficial UTI

### Modo Claro (Default)
* **Brand (Morado Principal):** `#2c1547`
* **Highlight (Naranja Acento):** `#f57021`
* **Fondo General (`--color-bg`):** `#f4f0f9`
* **Superficie / Cards (`--color-surface`):** `#ffffff`
* **Texto Principal (`--color-text`):** `#2c1547`
* **Texto Mudo (`--color-text-muted`):** `#6e5987`
* **Bordes (`--color-border`):** `#e2d9ee`

### Modo Oscuro (`.dark`)
* **Fondo Noche (`--color-bg`):** `#150b24`
* **Superficie Oscura (`--color-surface`):** `#26163d`
* **Brand Oscuro (`--color-brand`):** `#8a4ed9`
* **Highlight (`--color-highlight`):** `#f57021`
* **Texto Claro (`--color-text`):** `#f5f0fb`

---

## 📁 Estructura del Proyecto Plantilla

```text
plantilla UTI/
├── public/
│   ├── logo-uti.png
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── UploadZone.tsx
│   │   ├── CaseDetail.tsx
│   │   ├── ScheduleGrid.tsx
│   │   ├── CaseHistoryTable.tsx
│   │   ├── HealthStatusCard.tsx
│   │   └── RulesConfigModal.tsx
│   ├── css/
│   │   └── styles.css
│   ├── services/
│   │   └── api.ts
│   ├── theme/
│   │   └── theme.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```
