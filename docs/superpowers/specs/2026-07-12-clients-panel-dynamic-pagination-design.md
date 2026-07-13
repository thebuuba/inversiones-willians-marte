# Clients Panel — Viewport-Fit Pagination

## Problem

El panel de clientes tiene un scroll interno en la tabla con `PAGE_SIZE = 50`. Esto hace que:
- No se ajuste automáticamente a la resolución de la pantalla
- Tenga scroll vertical que el usuario no quiere
- Al abrir el sistema en diferentes pantallas, se ve distinto

## Solution

Reemplazar el scroll interno con **paginación dinámica**: el número de filas se calcula automáticamente según el espacio vertical disponible en el viewport.

## Design

### Layout (sin scroll, todo en una pantalla)

```
┌─────────────────────────────────────────┐
│  Header: Clientes           [Exportar]  │  ← Fijo
│                           [+Agregar]    │
├─────────────────────────────────────────┤
│  [Total] [Activos] [Sin prést] [Nuevos] │  ← Stats fijos
├─────────────────────────────────────────┤
│  Search bar                              │  ← Fijo
├─────────────────────────────────────────┤
│  CLIENTE │ CÉDULA │ TELÉFONO │ PRÉSTAMOS│  ← Col header fijo
├─────────────────────────────────────────┤
│  Fila 1                                  │
│  Fila 2                                  │
│  ... (n filas calculadas)               │  ← Solo las que entran
│  Fila n                                  │
│─────────────────────────────────────────│
│  ░░░ fade gradient ░░░░░░░░░░░░░░░░░░░ │  ← Si hay más páginas
├─────────────────────────────────────────┤
│  Mostrando n de total    < 1 / total >  │  ← Paginación fija
└─────────────────────────────────────────┘
```

### Dynamic Page Size Calculation

- Usar `ResizeObserver` en el contenedor del panel
- Restar alturas fijas: header de la card (search), column headers, pagination footer
- Dividir espacio restante entre altura de fila (`min-h-[64px]`)
- `pageSize = Math.max(1, Math.floor(availableHeight / 64))`
- Cuando cambia `pageSize`, refetch clients con nuevo size

**Row heights a restar:**
| Elemento | Altura aprox |
|---|---|
| Search bar container | 76px (p-4 + h-11 + gap) |
| Column header row | 49px (py-3.5 + line-height) |
| Pagination footer | 65px (py-4 + line-height) |
| Padding interno del container | ~1px (borde) |

```
availableHeight = containerHeight - 76 - 49 - 65 - 1
```

### Subtle "Alive" Indicator

- Cuando `totalPages > page + 1` (hay más páginas), agregar un **linear gradient fade** en la parte inferior de la tabla:
  - Posición: fixed dentro del contenedor, justo sobre la paginación
  - Altura: ~32px
  - Gradiente: `from-transparent to-[#F3F4F6]` (fondo de la página)
  - Opacidad sutil, solo para sugerir que hay contenido abajo

### Pagination Controls (ya existen)

Mantener los botones actuales `< 1 / total >` con el mismo diseño.

### Responsive Behavior

- `ResizeObserver` detecta cambios de tamaño de ventana
- Al cambiar tamaño, se recalcula `pageSize`
- Si `pageSize` cambia, se ajusta `page` para no exceder `totalPages`
- En mobile (pantallas angostas), el `pageSize` será menor automáticamente

### States

| State | Behavior |
|---|---|
| **Loading** | Skeleton placeholders matching el número de filas calculado |
| **Empty** | Mensaje "No se encontraron clientes" centrado, altura del contenedor de filas |
| **Error** | Banner de error existente arriba de la tabla |
| **Resize** | Recalcular pageSize, refetch si cambió |

### Edge Cases

- `pageSize` mínimo de 1 (pantalla muy pequeña)
- Si el `pageSize` calculado es mayor al `total` de clientes, mostrar todos sin paginación
- Al reducir la ventana, si la página actual excede el nuevo `totalPages`, resetear a página 0

## Technical Approach

### Component Changes (`clients-panel.tsx`)

1. Agregar ref al contenedor de la tabla con `useRef<HTMLDivElement>`
2. Usar `useResizeObserver` o `ResizeObserver` manual con `useEffect`
3. Eliminar `overflow-y-auto modal-scroll` del div de filas → `overflow-hidden`
4. Calcular `pageSize` dinámico en lugar de constante `PAGE_SIZE = 50`
5. Agregar fade gradient overlay condicional
6. Ajustar fetch params: `getClients(search, pageSize, page * pageSize)`

### Files to modify

- `apps/frontend/src/components/clients/clients-panel.tsx` (único archivo)

### No new dependencies

- `ResizeObserver` está disponible nativamente en browsers modernos
- No se necesita librería externa

## Out of Scope

- No cambiar el diseño visual ni colores existentes
- No modificar la lógica de negocio
- No tocar otros paneles
