# Settings Panel — Design Doc

## Overview

Hacer funcional el panel de configuración del sistema (ruta `/configuracion`), tab por tab, con persistencia en PostgreSQL vía Supabase. Los datos serán compartidos entre web (Next.js), iOS y Android.

## Tabs cubiertos

1. **General** — Información de empresa + localización
2. **Préstamos** — Parámetros por defecto + productos de préstamo
3. **Usuarios y roles** — Ya funcional, no se modifica
4. **Notificaciones** — Canales y alertas internas
5. **Seguridad** — Acceso/autenticación y respaldos
6. **Integraciones** — Se deja como placeholder (no se implementa)

## Modelo de datos (Prisma)

Cuatro tablas dedicadas, una por dominio de configuración:

### `company_settings`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| id | Int (PK) | autoincrement | |
| name | String? | null | Nombre comercial |
| rnc | String? | null | RNC / identificación fiscal |
| email | String? | null | Correo de contacto |
| phone | String? | null | Teléfono |
| address | String? | null | Dirección |
| logo_url | String? | null | URL del logo |
| language | String | "es" | Idioma del sistema |
| currency | String | "DOP" | Moneda principal |
| timezone | String | "America/Santo_Domingo" | Zona horaria |
| date_format | String | "DD/MM/YYYY" | Formato de fecha |
| updated_at | DateTime | auto | |

### `loan_defaults`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| id | Int (PK) | autoincrement | |
| monthly_interest_rate | Decimal | | Tasa de interés mensual (%) |
| late_penalty_rate | Decimal | | Mora por día de atraso (%) |
| min_term | Int | | Plazo mínimo (meses) |
| max_term | Int | | Plazo máximo (meses) |
| min_amount | Decimal | | Monto mínimo |
| max_amount | Decimal | | Monto máximo |
| payment_frequency | String | "MONTHLY" | Frecuencia de pago por defecto |
| calculation_method | String | "FLAT" | Método de cálculo |
| auto_approval | Boolean | false | Aprobación automática |
| require_guarantor | Boolean | false | Requerir garante |
| auto_amortization | Boolean | true | Generar amortización al crear |
| updated_at | DateTime | auto | |

### `notification_settings`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| id | Int (PK) | autoincrement | |
| payment_reminder_days | Int | 3 | Días antes para recordatorio |
| daily_send_time | String | "08:00" | Hora de envío diario |
| updated_at | DateTime | auto | |

### `security_settings`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| id | Int (PK) | autoincrement | |
| min_password_length | Int | 8 | Longitud mínima de contraseña |
| password_expiry_days | Int | 90 | Caducidad de contraseña (días) |
| updated_at | DateTime | auto | |

Cada tabla tendrá exactamente **una fila** (singleton). Se crea automáticamente si no existe al hacer GET.

## API (Backend — NestJS)

### Módulo: `SettingsModule`

Ruta base: `/api/v1/settings`

Todos los endpoints protegidos con `JwtAuthGuard` + `RolesGuard`. Solo ADMIN puede hacer PATCH.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/settings/company` | ADMIN, COLLECTOR | Obtener config. empresa |
| PATCH | `/settings/company` | ADMIN | Actualizar config. empresa |
| GET | `/settings/loans` | ADMIN, COLLECTOR | Obtener defaults préstamos |
| PATCH | `/settings/loans` | ADMIN | Actualizar defaults préstamos |
| GET | `/settings/notifications` | ADMIN, COLLECTOR | Obtener config. notificaciones |
| PATCH | `/settings/notifications` | ADMIN | Actualizar notificaciones |
| GET | `/settings/security` | ADMIN, COLLECTOR | Obtener config. seguridad |
| PATCH | `/settings/security` | ADMIN | Actualizar seguridad |

### Servicio

- Cada GET busca el primer registro; si no existe, lo crea con valores por defecto y lo retorna.
- Cada PATCH actualiza la fila existente (solo hay una).
- Los PATCH aceptan body parcial (solo los campos enviados se actualizan).
- Se registra auditoría en `AuditLog` para cada modificación.

## Frontend (Next.js)

### API helper: `lib/api/settings.ts`

Funciones tipadas por dominio:
- `getCompanySettings()`, `updateCompanySettings(dto)`
- `getLoanDefaults()`, `updateLoanDefaults(dto)`
- `getNotificationSettings()`, `updateNotificationSettings(dto)`
- `getSecuritySettings()`, `updateSecuritySettings(dto)`

### Cambios en `settings-page.tsx`

- Reemplazar inputs con `defaultValue` por inputs controlados con `value`/`onChange`
- Cada tab carga sus datos via `useEffect` + funciones API
- Estado local con `useState` por dominio
- Botón "Guardar cambios" hace PATCH del tab activo
- LogoUploader sube a endpoint multipart `/settings/company/logo`
- Sección "Productos de préstamo" conecta con API existente de `loan-products`
- Los select options se llenan con valores reales (monedas, zonas horarias, frecuencias, etc.)
- Toggles y switches escriben al estado local y se persisten al guardar

### Archivos modificados

- `components/settings/settings-page.tsx` — refactor a estado controlado + data fetching
- `lib/api/settings.ts` — nuevo archivo
- `app/configuracion/page.tsx` — sin cambios (sigue siendo wrapper)

## No incluido en esta iteración

- Tab Integraciones (placeholder)
- Notificaciones push/email reales (solo UI de configuración)
- Respaldo/restore real (solo UI de configuración)
- Subida de logo (multipart) como parte del PATCH de company

## Orden de implementación

1. Schema Prisma + migración
2. Módulo SettingsModule (controller, service, DTOs)
3. Registrar en AppModule
4. API helper frontend (`lib/api/settings.ts`)
5. Conectar tab General
6. Conectar tab Préstamos
7. Conectar tab Notificaciones
8. Conectar tab Seguridad
