# Agregar Inversionista — Wizard de 2 Pasos

## Resumen

Convertir la página actual de "/inversionistas/nuevo" de una sola página con dos columnas a un wizard de 2 pasos, manteniendo toda la funcionalidad existente (mascaras, foto, guardado, error handling) y sin cambiar la URL.

## Diseño

### Paso 1 — Información Personal

Contenido:
- Datos personales (nombres, apellidos, cédula, f. nacimiento, nacionalidad, tipo)
- Contacto (teléfono móvil, teléfono alt, email)
- Foto del inversionista

Layout: Una sola columna, la foto como card aparte.

Botones: `[Cancelar] [Siguiente →]`

### Paso 2 — Inversión

Contenido:
- Condiciones (capital inicial, tasa, frecuencia, banco)
- Plazo (fecha inicio, plazo pactado)
- Notas y observaciones

Botones: `[← Atrás] [Guardar] [Guardar y nuevo]`

### Barra de progreso

- Indicador visual "Paso 1 de 2" con dots
- Los pasos son clickeables para navegar entre ellos
- El paso activo se resalta visualmente

### Comportamiento

- Mismo estado `form` compartido entre ambos pasos
- Misma ruta `/inversionistas/nuevo` — sin navegación real
- Animaciones Framer Motion para la transición entre pasos
- Los datos persisten al cambiar de paso
- Error display visible en ambos pasos
- El botón Cancelar aparece en ambos pasos

### No cambia

- Mascaras de cédula y teléfono
- Compresión de foto
- Llamada a `createInvestor` con limpieza de formatos
- Manejo de errores del backend
- Invalidación de caché post-guardado

## Archivos a modificar

- `apps/frontend/src/app/inversionistas/nuevo/page.tsx`
