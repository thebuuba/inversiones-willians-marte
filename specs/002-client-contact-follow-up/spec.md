# Feature Specification: Seguimiento de contacto con clientes

**Feature Branch**: `agent/paleta-calida`  
**Created**: 2026-07-26  
**Status**: Draft  
**Input**: Registrar contactos desde clientes y organizar recomendaciones, seguimientos y promesas de pago en Agenda.

## User Scenarios & Testing

### User Story 1 - Contactar desde la lista de clientes (Priority: P1)

Un cobrador puede iniciar una gestión directamente desde un cliente, llamar al teléfono registrado y guardar el canal, resultado, notas y próximo seguimiento sin seleccionar un préstamo.

**Independent Test**: Abrir Clientes, pulsar “Contactar”, registrar una llamada y comprobar que aparece en el historial del préstamo.

**Acceptance Scenarios**:

1. **Given** un cliente con teléfono, **When** se pulsa “Contactar”, **Then** se muestra el número registrado con acciones para llamar y abrir WhatsApp.
2. **Given** un cliente con uno, varios o ningún préstamo, **When** se registra el contacto, **Then** no se solicita seleccionar un préstamo.
3. **Given** un próximo seguimiento, **When** se guarda la gestión, **Then** aparece en Agenda dentro de “Seguimientos de clientes”.

---

### User Story 2 - Registrar compromiso y seguimiento (Priority: P1)

Durante el contacto, el cobrador puede registrar una promesa de pago o una próxima fecha de seguimiento.

**Independent Test**: Registrar “Promesa de pago” con monto y fecha y comprobar que se crea una tarea de cobro en Agenda.

**Acceptance Scenarios**:

1. **Given** una conversación con promesa de pago, **When** se guardan monto y fecha, **Then** la promesa queda vinculada al cliente y préstamo y crea una tarea en Agenda.
2. **Given** un contacto que requiere otra llamada, **When** se define fecha y hora de seguimiento, **Then** se crea una tarea de cobro para ese momento.

---

### User Story 3 - Priorizar contactos en Agenda (Priority: P2)

El cobrador puede ver dentro de Agenda a quién recomienda contactar el sistema y consultar si ya hubo un contacto reciente.

**Independent Test**: Abrir Agenda y comprobar que la sección de seguimiento lista los préstamos vencidos priorizados, su motivo y último contacto.

**Acceptance Scenarios**:

1. **Given** préstamos vencidos, **When** se abre Agenda, **Then** se muestran primero los clientes de mayor prioridad con la acción sugerida.
2. **Given** una recomendación con teléfono, **When** el cobrador pulsa llamar o WhatsApp, **Then** se abre el canal correspondiente.
3. **Given** una recomendación, **When** el cobrador pulsa “Registrar”, **Then** se abre el mismo formulario de gestión usado desde el préstamo.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST mostrar una acción visible “Contactar” por cliente.
- **FR-002**: El sistema MUST asociar cada contacto al cliente; el préstamo es opcional y solo se usa desde una gestión de cobro iniciada dentro del préstamo.
- **FR-003**: El sistema MUST reutilizar el registro existente de canal, resultado, notas, promesa y próximo seguimiento.
- **FR-004**: El sistema MUST crear tareas de Agenda para promesas y seguimientos usando el flujo transaccional existente.
- **FR-005**: Agenda MUST mostrar las recomendaciones existentes de prioridad de cobro, incluyendo motivo, deuda vencida y último contacto.
- **FR-006**: Agenda MUST permitir iniciar llamadas, WhatsApp y registrar una gestión desde una recomendación.
- **FR-007**: El flujo MUST conservar validación de permisos para administradores y cobradores.
- **FR-008**: El sistema MUST mostrar el teléfono principal y alternativo disponibles al iniciar el contacto.

### Key Entities

- **Gestión de cobro**: contacto realizado, canal, resultado, notas y próximo seguimiento.
- **Promesa de pago**: monto y fecha comprometidos, estado de cumplimiento.
- **Tarea**: recordatorio de Agenda vinculado al cliente, préstamo y gestión.
- **Prioridad de cobro**: recomendación calculada según atraso, promesas incumplidas y tiempo desde el último contacto.

## Success Criteria

- **SC-001**: Un cobrador puede iniciar y guardar una gestión desde Clientes sin navegar manualmente por más de una pantalla intermedia.
- **SC-002**: El 100% de las promesas y seguimientos guardados genera su tarea vinculada en Agenda.
- **SC-003**: Agenda muestra las cinco recomendaciones de contacto de mayor prioridad en menos de 3 segundos bajo condiciones normales.
- **SC-004**: No se duplica la lógica de persistencia de contactos, promesas ni tareas.

## Assumptions

- El contacto iniciado desde la ficha del cliente es general y no requiere un préstamo.
- Agenda será el punto inicial del panel de contacto; un módulo independiente solo se justificará si el volumen futuro supera la lectura cómoda de Agenda.
- La recomendación automática existente es suficiente para esta primera versión.
