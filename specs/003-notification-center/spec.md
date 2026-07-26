# Feature Specification: Centro de notificaciones

**Feature Branch**: `agent/paleta-calida`  
**Created**: 2026-07-26  
**Status**: Draft  
**Input**: Activar el botón de notificaciones para avisar contactos pendientes, seguimientos de clientes y quehaceres asignados por otros usuarios.

## User Scenarios & Testing

### User Story 1 - Ver notificaciones nuevas al entrar (Priority: P1)

Cada usuario ve en la barra superior cuántas notificaciones nuevas tiene y puede abrir un panel con el resumen de lo que requiere su atención.

**Independent Test**: Iniciar sesión con notificaciones pendientes y comprobar que la campana muestra el contador correcto y que el panel permite abrir cada elemento.

**Acceptance Scenarios**:

1. **Given** un usuario con elementos no leídos, **When** entra al sistema, **Then** la campana muestra la cantidad de notificaciones nuevas.
2. **Given** el panel abierto, **When** selecciona una notificación, **Then** esta se marca como leída y dirige al cliente, préstamo o Agenda correspondiente.
3. **Given** varias notificaciones nuevas, **When** pulsa “Marcar todas como leídas”, **Then** el contador desaparece sin eliminar los elementos.

---

### User Story 2 - Recibir avisos de contacto y cobranza (Priority: P1)

Los administradores y cobradores reciben avisos cuando el sistema recomienda contactar un cliente o cuando llega la fecha de una promesa o seguimiento.

**Independent Test**: Preparar un préstamo con contacto recomendado y una tarea de seguimiento vencida y comprobar que ambos avisos aparecen sin duplicarse.

**Acceptance Scenarios**:

1. **Given** un cliente que requiere contacto, **When** se calcula la prioridad de cobranza, **Then** aparece un aviso con el cliente, motivo y acceso al préstamo.
2. **Given** una promesa o seguimiento para hoy o vencido, **When** el usuario abre las notificaciones, **Then** aparece como pendiente hasta completarse.
3. **Given** una recomendación leída que aumenta de urgencia posteriormente, **When** cambia su condición relevante, **Then** puede volver a notificarse.

---

### User Story 3 - Asignar quehaceres de oficina (Priority: P2)

Un usuario puede crear una tarea para sí mismo o asignarla a otro usuario activo; el destinatario recibe una notificación que identifica quién la asignó.

**Independent Test**: Crear una tarea asignada a otro usuario, iniciar sesión como destinatario y comprobar que recibe el aviso y ve la tarea en Agenda.

**Acceptance Scenarios**:

1. **Given** usuarios activos, **When** se crea una tarea, **Then** el creador puede elegir al responsable.
2. **Given** una tarea asignada por otra persona, **When** el responsable abre notificaciones, **Then** ve el título, vencimiento y nombre del remitente.
3. **Given** una tarea completada, **When** se actualiza su estado, **Then** deja de contarse como pendiente.

## Edge Cases

- No se muestran tareas asignadas a otro usuario.
- Los usuarios inactivos no pueden recibir nuevas asignaciones.
- Un fallo temporal al cargar no bloquea la navegación general.
- El contador se presenta de forma compacta cuando supera 99.

## Requirements

### Functional Requirements

- **FR-001**: La barra superior MUST mostrar una campana accesible con contador de elementos no leídos.
- **FR-002**: El panel MUST combinar recomendaciones de contacto y tareas asignadas sin duplicar un mismo elemento.
- **FR-003**: Cada notificación MUST indicar tipo, título, contexto, fecha y destino.
- **FR-004**: Los usuarios MUST poder marcar una notificación o todas como leídas.
- **FR-005**: El estado leído MUST conservarse para el usuario entre sesiones y dispositivos.
- **FR-006**: Las tareas MUST permitir seleccionar un responsable activo y usar al creador como responsable predeterminado.
- **FR-007**: El destinatario MUST recibir una notificación cuando otra persona le asigne una tarea.
- **FR-008**: Las tareas asignadas MUST aparecer en la Agenda del responsable.
- **FR-009**: Las tareas completadas MUST dejar de aparecer como notificaciones pendientes.
- **FR-010**: Las recomendaciones de cobranza MUST enlazar al préstamo relacionado.
- **FR-011**: El sistema MUST respetar los permisos existentes de administradores y cobradores.

### Key Entities

- **Notificación**: aviso dirigido a un usuario, con origen, destino, fecha y estado de lectura.
- **Tarea**: quehacer con creador, responsable, prioridad, vencimiento y estado.
- **Recomendación de contacto**: aviso calculado a partir del atraso, promesas y contactos recientes.
- **Usuario**: persona activa que crea o recibe tareas y avisos.

## Success Criteria

- **SC-001**: El contador y el panel muestran las novedades del usuario en menos de 3 segundos bajo condiciones normales.
- **SC-002**: El 100% de las tareas asignadas a otro usuario genera un aviso visible para el destinatario.
- **SC-003**: Una notificación marcada como leída permanece leída después de cerrar sesión y entrar desde otro dispositivo.
- **SC-004**: Los usuarios pueden llegar al elemento relacionado con una sola selección desde el panel.
- **SC-005**: Ningún usuario puede ver tareas privadas asignadas exclusivamente a otra persona.

## Assumptions

- Todos los usuarios autenticados pueden asignar tareas a otros usuarios activos.
- Las recomendaciones generales de cobranza son visibles para administradores y cobradores.
- La primera versión usa actualización periódica al entrar y mientras el sistema está abierto; no requiere notificaciones externas por correo, SMS o dispositivo.
