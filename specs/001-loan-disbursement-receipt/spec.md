# Feature Specification: Recibo de desembolso de préstamo

**Feature Branch**: `[001-loan-disbursement-receipt]`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Al crear un préstamo, permitir generar automáticamente un recibo imprimible, con firma del cliente, original para la empresa y copia para el cliente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear préstamo y recibo en un solo flujo (Priority: P1)

El administrador o cobrador marca la opción **Generar recibo** al preparar un préstamo. Cuando el préstamo se guarda correctamente, el sistema muestra inmediatamente la vista previa del recibo correspondiente sin exigir que el empleado vuelva a digitar los datos.

**Why this priority**: Elimina el trabajo manual repetido y reduce errores entre el préstamo registrado y el comprobante entregado.

**Independent Test**: Crear un préstamo con la opción marcada y comprobar que aparece un recibo cuyos datos coinciden con el préstamo recién creado.

**Acceptance Scenarios**:

1. **Given** un préstamo válido con la opción **Generar recibo** marcada, **When** el usuario confirma la creación, **Then** el sistema guarda el préstamo y abre la vista previa de su recibo.
2. **Given** un préstamo válido con la opción desmarcada, **When** el usuario confirma la creación, **Then** el sistema guarda el préstamo y continúa el flujo normal sin abrir el recibo.
3. **Given** un error al crear el préstamo, **When** el sistema rechaza la operación, **Then** no genera ni numera un recibo.

---

### User Story 2 - Imprimir original y copia (Priority: P1)

Desde la vista previa, el usuario puede imprimir el original de la empresa, la copia del cliente o ambas. Cada ejemplar identifica claramente su destino y contiene espacios para las firmas requeridas.

**Why this priority**: La automatización solo reemplaza el recibo manual si produce los dos ejemplares que utiliza la oficina.

**Independent Test**: Abrir un recibo y seleccionar cada modalidad de impresión para verificar el contenido, la etiqueta y los espacios de firma.

**Acceptance Scenarios**:

1. **Given** un recibo generado y papel autocopiante de dos capas, **When** el usuario elige **Autocopiante**, **Then** se prepara una sola impresión que produce simultáneamente el original blanco y la copia amarilla.
2. **Given** un recibo generado, **When** el usuario elige solo original o solo copia, **Then** se prepara únicamente el ejemplar seleccionado.
3. **Given** cualquiera de los ejemplares, **When** se imprime, **Then** incluye un espacio legible para la firma del cliente y otro para el representante de la empresa.

---

### User Story 3 - Consultar y reimprimir el recibo (Priority: P2)

El administrador o cobrador puede abrir el detalle de un préstamo existente, consultar su recibo y volver a imprimirlo sin crear otro préstamo ni alterar el comprobante original.

**Why this priority**: Permite recuperar una copia perdida y evita que la generación inicial sea el único momento disponible.

**Independent Test**: Abrir un préstamo con recibo desde su detalle y reimprimir ambos ejemplares conservando número y datos originales.

**Acceptance Scenarios**:

1. **Given** un préstamo que ya tiene recibo, **When** el usuario abre el recibo desde el detalle, **Then** ve el mismo número y la misma información registrada originalmente.
2. **Given** un préstamo sin recibo, **When** el usuario solicita generarlo desde el detalle, **Then** el sistema crea un único recibo vinculado al préstamo y muestra su vista previa.
3. **Given** un recibo existente, **When** el usuario lo reimprime, **Then** no se crea un número nuevo ni se modifican sus datos.

---

### User Story 4 - Conservar evidencia digital (Priority: P3)

El usuario puede guardar el recibo como archivo digital para archivarlo o enviarlo al cliente, manteniendo el mismo contenido de la versión impresa.

**Why this priority**: Reduce pérdidas de documentos y facilita entregar una copia adicional sin volver a imprimir.

**Independent Test**: Guardar un recibo y comprobar que el archivo conserva las etiquetas, datos y espacios de firma de la vista previa.

**Acceptance Scenarios**:

1. **Given** un recibo generado, **When** el usuario elige guardar, **Then** obtiene un archivo legible con los mismos datos del recibo.
2. **Given** un recibo guardado, **When** se abre fuera del sistema, **Then** se distingue claramente si contiene el original, la copia o ambos.

### Edge Cases

- Si la ventana de impresión se cancela o la impresora falla, el préstamo y el recibo permanecen guardados y pueden reimprimirse.
- Si dos usuarios generan recibos al mismo tiempo, cada recibo recibe un número único.
- En refinanciamientos o reenganches, el recibo distingue el monto nominal del préstamo del monto realmente entregado al cliente.
- Si cambian posteriormente los datos del cliente, la empresa o el préstamo, el recibo histórico conserva la información vigente al momento de su emisión.
- Los importes, fechas o textos extensos deben mantenerse legibles sin cortar información esencial.
- Un usuario sin permiso para consultar el préstamo tampoco puede consultar, generar ni imprimir su recibo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El formulario de creación de préstamos MUST ofrecer una opción claramente identificada como **Generar recibo**.
- **FR-002**: La opción **Generar recibo** MUST estar marcada inicialmente para favorecer el flujo automatizado, pero el usuario puede desmarcarla antes de guardar.
- **FR-003**: El sistema MUST generar el recibo solamente después de que el préstamo se haya creado correctamente.
- **FR-004**: Cada préstamo MUST tener como máximo un recibo de desembolso vigente.
- **FR-005**: Cada recibo MUST tener un número único, visible y estable.
- **FR-006**: El recibo MUST incluir, como mínimo: identidad de la empresa, número y fecha del recibo, número del préstamo, nombre e identificación del cliente, monto nominal, monto efectivamente entregado, producto o modalidad, frecuencia de pago, plazo, primera fecha de pago, propósito o nota cuando exista y usuario que registró la operación.
- **FR-007**: El recibo MUST mostrar los importes en formato numérico y en palabras para reducir ambigüedades.
- **FR-008**: El sistema MUST mostrar una vista previa antes de imprimir o guardar el recibo.
- **FR-009**: El usuario MUST poder imprimir: una salida autocopiante de dos capas, un original suelto o una copia suelta.
- **FR-010**: Original y copia MUST contener los mismos datos financieros; las salidas sueltas MUST diferenciarse mediante una etiqueta visible y la salida autocopiante MUST identificar el color destinado a cada parte.
- **FR-011**: Cada ejemplar MUST incluir espacios para la firma manuscrita del cliente y del representante de la empresa, junto con sus nombres o identificaciones.
- **FR-012**: El usuario MUST poder abrir, guardar y reimprimir el recibo desde el detalle del préstamo.
- **FR-013**: Reimprimir o volver a guardar un recibo MUST conservar su número y contenido histórico.
- **FR-014**: El sistema MUST guardar una instantánea de los datos mostrados en el recibo para que cambios posteriores no alteren un comprobante ya emitido.
- **FR-015**: La generación, consulta y reimpresión MUST respetar los permisos existentes del préstamo.
- **FR-016**: El sistema MUST registrar quién generó el recibo y cuándo lo hizo.
- **FR-017**: Un fallo o cancelación de impresión MUST NOT revertir ni duplicar el préstamo o el recibo.
- **FR-018**: La salida impresa MUST adaptarse al formato configurado sin depender de una marca específica de impresora.
- **FR-019**: La primera versión MUST admitir firma manuscrita sobre el papel; la captura de firma electrónica queda fuera de alcance.
- **FR-020**: El recibo MUST ser un comprobante de entrega o desembolso y MUST NOT sustituir el contrato, pagaré ni tabla de amortización del préstamo.

### Key Entities

- **Recibo de desembolso**: Comprobante único asociado a un préstamo; conserva número, fecha, monto nominal, monto entregado, datos históricos del cliente y la empresa, condiciones resumidas y autor de la emisión.
- **Ejemplar de recibo**: Representación imprimible del recibo, identificada como original de la empresa o copia del cliente.
- **Préstamo**: Operación financiera que origina el recibo y aporta sus datos, incluyendo las diferencias de desembolso en refinanciamientos o reenganches.
- **Firmante**: Cliente o representante de la empresa cuyo nombre y espacio de firma aparecen en cada ejemplar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear un préstamo y tener ambos ejemplares listos para imprimir en menos de 30 segundos adicionales.
- **SC-002**: El 100% de los recibos generados coincide con los importes, el cliente y el número del préstamo que los originó.
- **SC-003**: El 100% de los recibos conserva su número y contenido al reimprimirse.
- **SC-004**: Al menos el 90% de los préstamos nuevos utiliza la generación automática durante el primer mes de uso.
- **SC-005**: La oficina reduce en al menos 80% el tiempo dedicado a redactar recibos manualmente.
- **SC-006**: En pruebas con el formato de papel elegido, ambos ejemplares imprimen completos y legibles sin cortar datos esenciales.

## Assumptions

- La primera versión utiliza firmas manuscritas después de imprimir; firma electrónica, biometría y certificados digitales quedan fuera de alcance.
- La identidad de la empresa se toma de la configuración existente del sistema.
- El recibo acredita la entrega del dinero, no reemplaza documentos contractuales.
- La opción de generación aparece marcada inicialmente y puede desactivarse por préstamo.
- Los usuarios autorizados actualmente para crear y consultar préstamos conservarán esos mismos permisos sobre los recibos.
- La función reutiliza la capacidad existente de vista previa, impresión y guardado de recibos.
- La selección final del tamaño de papel se confirmará antes de la planificación; el contenido no dependerá de una marca específica.
