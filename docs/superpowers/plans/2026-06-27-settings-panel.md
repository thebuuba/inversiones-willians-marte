# Settings Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer funcional el panel de configuración (ruta `/configuracion`) conectando 4 tabs a la base de datos PostgreSQL.

**Architecture:** Cuatro tablas singleton en Prisma (`company_settings`, `loan_defaults`, `notification_settings`, `security_settings`), un módulo NestJS `SettingsModule` con endpoints REST, y un helper API en el frontend para conectar cada tab.

**Tech Stack:** NestJS 11, Prisma, PostgreSQL (Supabase), Next.js 16, Axios

---

### Task 1: Schema Prisma + Migración

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Run: `pnpm db:generate` + `pnpm db:push:dev`

- [ ] **Step 1: Agregar los 4 modelos al schema**

Agregar al final de `packages/database/prisma/schema.prisma`, antes del `@@map("audit_logs")` closing (pero mejor al final del archivo):

```prisma
// ─── Settings ────────────────────────────────────────────────────────────────

model CompanySetting {
  id         Int      @id @default(autoincrement())
  name       String?
  rnc        String?
  email      String?
  phone      String?
  address    String?
  logoUrl    String?  @map("logo_url")
  language   String   @default("es")
  currency   String   @default("DOP")
  timezone   String   @default("America/Santo_Domingo")
  dateFormat String   @default("DD/MM/YYYY") @map("date_format")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}

model LoanDefault {
  id                  Int     @id @default(autoincrement())
  monthlyInterestRate Decimal @map("monthly_interest_rate")
  latePenaltyRate     Decimal @map("late_penalty_rate")
  minTerm             Int     @map("min_term")
  maxTerm             Int     @map("max_term")
  minAmount           Decimal @map("min_amount")
  maxAmount           Decimal @map("max_amount")
  paymentFrequency    String  @default("MONTHLY") @map("payment_frequency")
  calculationMethod   String  @default("FLAT") @map("calculation_method")
  autoApproval        Boolean @default(false) @map("auto_approval")
  requireGuarantor    Boolean @default(false) @map("require_guarantor")
  autoAmortization    Boolean @default(true) @map("auto_amortization")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("loan_defaults")
}

model NotificationSetting {
  id                  Int      @id @default(autoincrement())
  paymentReminderDays Int      @default(3) @map("payment_reminder_days")
  dailySendTime       String   @default("08:00") @map("daily_send_time")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("notification_settings")
}

model SecuritySetting {
  id                 Int      @id @default(autoincrement())
  minPasswordLength  Int      @default(8) @map("min_password_length")
  passwordExpiryDays Int      @default(90) @map("password_expiry_days")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("security_settings")
)
```

- [ ] **Step 2: Generar cliente Prisma y pushear a dev**

```bash
pnpm db:generate && pnpm db:push:dev
```

Expected: `✅ Generated Prisma Client` + `Your database is up to date`

- [ ] **Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add settings tables to prisma schema"
```

---

### Task 2: Módulo Backend — DTOs

**Files:**
- Create: `apps/backend/src/modules/settings/dto/update-company-setting.dto.ts`
- Create: `apps/backend/src/modules/settings/dto/update-loan-default.dto.ts`
- Create: `apps/backend/src/modules/settings/dto/update-notification-setting.dto.ts`
- Create: `apps/backend/src/modules/settings/dto/update-security-setting.dto.ts`

- [ ] **Step 1: Crear directorio DTO**

```bash
mkdir -p apps/backend/src/modules/settings/dto
```

- [ ] **Step 2: Crear `update-company-setting.dto.ts`**

```typescript
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCompanySettingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  rnc?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;
}
```

- [ ] **Step 3: Crear `update-loan-default.dto.ts`**

```typescript
import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLoanDefaultDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyInterestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenaltyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minTerm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxTerm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  paymentFrequency?: string;

  @IsOptional()
  @IsString()
  calculationMethod?: string;

  @IsOptional()
  @IsBoolean()
  autoApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  requireGuarantor?: boolean;

  @IsOptional()
  @IsBoolean()
  autoAmortization?: boolean;
}
```

- [ ] **Step 4: Crear `update-notification-setting.dto.ts`**

```typescript
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationSettingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paymentReminderDays?: number;

  @IsOptional()
  @IsString()
  dailySendTime?: string;
}
```

- [ ] **Step 5: Crear `update-security-setting.dto.ts`**

```typescript
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSecuritySettingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(4)
  minPasswordLength?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  passwordExpiryDays?: number;
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/settings/dto
git commit -m "feat: add settings DTOs"
```

---

### Task 3: Módulo Backend — Service

**Files:**
- Create: `apps/backend/src/modules/settings/settings.service.ts`

- [ ] **Step 1: Crear `settings.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { UpdateCompanySettingDto } from './dto/update-company-setting.dto';
import { UpdateLoanDefaultDto } from './dto/update-loan-default.dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { UpdateSecuritySettingDto } from './dto/update-security-setting.dto';

@Injectable()
export class SettingsService {
  // ─── Company ──────────────────────────────────────────────────

  async getCompany() {
    const existing = await prisma.companySetting.findFirst();
    if (existing) return existing;
    return prisma.companySetting.create({ data: {} });
  }

  async updateCompany(dto: UpdateCompanySettingDto, actorUserId?: string) {
    const current = await this.getCompany();
    const updated = await prisma.companySetting.update({
      where: { id: current.id },
      data: dto,
    });

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SETTINGS_COMPANY_UPDATED',
          entityType: 'CompanySetting',
          entityId: String(current.id),
          oldValues: current,
          newValues: updated,
        },
      });
    }

    return updated;
  }

  // ─── Loan Defaults ────────────────────────────────────────────

  async getLoanDefaults() {
    const existing = await prisma.loanDefault.findFirst();
    if (existing) return existing;
    return prisma.loanDefault.create({ data: {} });
  }

  async updateLoanDefaults(dto: UpdateLoanDefaultDto, actorUserId?: string) {
    const current = await this.getLoanDefaults();
    const updated = await prisma.loanDefault.update({
      where: { id: current.id },
      data: dto,
    });

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SETTINGS_LOAN_DEFAULTS_UPDATED',
          entityType: 'LoanDefault',
          entityId: String(current.id),
          oldValues: current,
          newValues: updated,
        },
      });
    }

    return updated;
  }

  // ─── Notifications ────────────────────────────────────────────

  async getNotifications() {
    const existing = await prisma.notificationSetting.findFirst();
    if (existing) return existing;
    return prisma.notificationSetting.create({ data: {} });
  }

  async updateNotifications(dto: UpdateNotificationSettingDto, actorUserId?: string) {
    const current = await this.getNotifications();
    const updated = await prisma.notificationSetting.update({
      where: { id: current.id },
      data: dto,
    });

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SETTINGS_NOTIFICATIONS_UPDATED',
          entityType: 'NotificationSetting',
          entityId: String(current.id),
          oldValues: current,
          newValues: updated,
        },
      });
    }

    return updated;
  }

  // ─── Security ─────────────────────────────────────────────────

  async getSecurity() {
    const existing = await prisma.securitySetting.findFirst();
    if (existing) return existing;
    return prisma.securitySetting.create({ data: {} });
  }

  async updateSecurity(dto: UpdateSecuritySettingDto, actorUserId?: string) {
    const current = await this.getSecurity();
    const updated = await prisma.securitySetting.update({
      where: { id: current.id },
      data: dto,
    });

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SETTINGS_SECURITY_UPDATED',
          entityType: 'SecuritySetting',
          entityId: String(current.id),
          oldValues: current,
          newValues: updated,
        },
      });
    }

    return updated;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/settings/settings.service.ts
git commit -m "feat: add settings service with CRUD + audit"
```

---

### Task 4: Módulo Backend — Controller

**Files:**
- Create: `apps/backend/src/modules/settings/settings.controller.ts`

- [ ] **Step 1: Crear `settings.controller.ts`**

```typescript
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateCompanySettingDto } from './dto/update-company-setting.dto';
import { UpdateLoanDefaultDto } from './dto/update-loan-default.dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { UpdateSecuritySettingDto } from './dto/update-security-setting.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get('company')
  @Roles('ADMIN', 'COLLECTOR')
  getCompany() {
    return this.service.getCompany();
  }

  @Patch('company')
  @Roles('ADMIN')
  updateCompany(
    @Body() dto: UpdateCompanySettingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateCompany(dto, userId);
  }

  @Get('loans')
  @Roles('ADMIN', 'COLLECTOR')
  getLoanDefaults() {
    return this.service.getLoanDefaults();
  }

  @Patch('loans')
  @Roles('ADMIN')
  updateLoanDefaults(
    @Body() dto: UpdateLoanDefaultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateLoanDefaults(dto, userId);
  }

  @Get('notifications')
  @Roles('ADMIN', 'COLLECTOR')
  getNotifications() {
    return this.service.getNotifications();
  }

  @Patch('notifications')
  @Roles('ADMIN')
  updateNotifications(
    @Body() dto: UpdateNotificationSettingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateNotifications(dto, userId);
  }

  @Get('security')
  @Roles('ADMIN', 'COLLECTOR')
  getSecurity() {
    return this.service.getSecurity();
  }

  @Patch('security')
  @Roles('ADMIN')
  updateSecurity(
    @Body() dto: UpdateSecuritySettingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateSecurity(dto, userId);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/settings/settings.controller.ts
git commit -m "feat: add settings controller with 8 endpoints"
```

---

### Task 5: Módulo Backend — Module + Registro

**Files:**
- Create: `apps/backend/src/modules/settings/settings.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Crear `settings.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
```

- [ ] **Step 2: Registrar en `app.module.ts`**

Agregar import y agregar al array `imports`:

```typescript
import { SettingsModule } from './modules/settings/settings.module';
```

En el array `imports: [...]` agregar `SettingsModule,`

- [ ] **Step 3: Verificar que compile**

```bash
cd apps/backend && npx nest build
```

Expected: `Found 0 errors. Watching for file changes.` (o similar sin errores)

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/settings/settings.module.ts apps/backend/src/app.module.ts
git commit -m "feat: register SettingsModule in AppModule"
```

---

### Task 6: Frontend — API Helper

**Files:**
- Create: `apps/frontend/src/lib/api/settings.ts`

- [ ] **Step 1: Crear `lib/api/settings.ts`**

```typescript
import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface CompanySettings {
  id: number;
  name: string | null;
  rnc: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

export interface LoanDefaults {
  id: number;
  monthlyInterestRate: number;
  latePenaltyRate: number;
  minTerm: number;
  maxTerm: number;
  minAmount: number;
  maxAmount: number;
  paymentFrequency: string;
  calculationMethod: string;
  autoApproval: boolean;
  requireGuarantor: boolean;
  autoAmortization: boolean;
}

export interface NotificationSettings {
  id: number;
  paymentReminderDays: number;
  dailySendTime: string;
}

export interface SecuritySettings {
  id: number;
  minPasswordLength: number;
  passwordExpiryDays: number;
}

// ─── Company ────────────────────────────────────────────────────

export async function getCompanySettings(): Promise<CompanySettings> {
  const { data } = await api.get<ApiResponse<CompanySettings>>('/settings/company');
  return data.data as CompanySettings;
}

export async function updateCompanySettings(
  dto: Partial<Omit<CompanySettings, 'id'>>,
): Promise<CompanySettings> {
  const { data } = await api.patch<ApiResponse<CompanySettings>>('/settings/company', dto);
  return data.data as CompanySettings;
}

// ─── Loan Defaults ──────────────────────────────────────────────

export async function getLoanDefaults(): Promise<LoanDefaults> {
  const { data } = await api.get<ApiResponse<LoanDefaults>>('/settings/loans');
  return data.data as LoanDefaults;
}

export async function updateLoanDefaults(
  dto: Partial<Omit<LoanDefaults, 'id'>>,
): Promise<LoanDefaults> {
  const { data } = await api.patch<ApiResponse<LoanDefaults>>('/settings/loans', dto);
  return data.data as LoanDefaults;
}

// ─── Notifications ──────────────────────────────────────────────

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<ApiResponse<NotificationSettings>>('/settings/notifications');
  return data.data as NotificationSettings;
}

export async function updateNotificationSettings(
  dto: Partial<Omit<NotificationSettings, 'id'>>,
): Promise<NotificationSettings> {
  const { data } = await api.patch<ApiResponse<NotificationSettings>>('/settings/notifications', dto);
  return data.data as NotificationSettings;
}

// ─── Security ───────────────────────────────────────────────────

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const { data } = await api.get<ApiResponse<SecuritySettings>>('/settings/security');
  return data.data as SecuritySettings;
}

export async function updateSecuritySettings(
  dto: Partial<Omit<SecuritySettings, 'id'>>,
): Promise<SecuritySettings> {
  const { data } = await api.patch<ApiResponse<SecuritySettings>>('/settings/security', dto);
  return data.data as SecuritySettings;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/lib/api/settings.ts
git commit -m "feat: add settings API helper for frontend"
```

---

### Task 7: Frontend — Conectar Tab General

**Files:**
- Modify: `apps/frontend/src/components/settings/settings-page.tsx`

- [ ] **Step 1: Refactor `CompanyInfoCard` y `LocalizationCard` con estado controlado**

Reemplazar los componentes de CompanyInfoCard y LocalizationCard para recibir props controladas, y conectar `SettingsGeneralTab` a la API.

El cambio principal en `SettingsGeneralTab`:

```typescript
import {
  getCompanySettings,
  updateCompanySettings,
  type CompanySettings,
} from '@/lib/api/settings';

// ...

function SettingsGeneralTab({ onSavingChange }: { onSavingChange?: (saving: boolean) => void }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [draft, setDraft] = useState<Partial<CompanySettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanySettings()
      .then((data) => { setSettings(data); setDraft({}); })
      .finally(() => setLoading(false));
  }, []);

  const patch = (key: string, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  if (loading) return <p className="text-sm text-[#5C6D63]">Cargando...</p>;

  const merged = { ...(settings ?? {}), ...draft } as CompanySettings;

  return (
    <motion.div ...>
      <CompanyInfoCard values={merged} onChange={patch} />
      <LocalizationCard values={merged} onChange={patch} />
    </motion.div>
  );
}
```

`CompanyInfoCard` ahora recibe `values` y `onChange` props, y los inputs usan `value` en vez de `defaultValue`:

```typescript
function CompanyInfoCard({
  values,
  onChange,
}: {
  values: CompanySettings;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <SectionCard className="p-6" index={2}>
      <CardTitle ... />
      <LogoUploader />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput label="Nombre comercial" value={values.name ?? ''} onChange={(v) => onChange('name', v)} />
        <FormInput label="RNC / Identificación" value={values.rnc ?? ''} onChange={(v) => onChange('rnc', v)} />
        <FormInput label="Correo de contacto" value={values.email ?? ''} onChange={(v) => onChange('email', v)} />
        <FormInput label="Teléfono" value={values.phone ?? ''} onChange={(v) => onChange('phone', v)} />
        <FormInput className="md:col-span-2" label="Dirección" multiline value={values.address ?? ''} onChange={(v) => onChange('address', v)} />
      </div>
    </SectionCard>
  );
}
```

`FormInput` necesita soportar `onChange`:

```typescript
function FormInput({
  label, value, helper, className = '', multiline = false, prefix, suffix, onChange,
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#5C6D63]">{label}</span>
      {multiline ? (
        <textarea
          className="..." value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className="flex h-11 w-full items-center rounded-[10px] border ...">
          {prefix && <span className="mr-3 ...">{prefix}</span>}
          <input className="..." value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {suffix && <span className="ml-3 ...">{suffix}</span>}
        </div>
      )}
      {helper && <span className="mt-2 ...">{helper}</span>}
    </label>
  );
}
```

`FormSelect` también:

```typescript
function FormSelect({
  label, value, options = [], helper, onChange,
}: {
  label: string;
  value: string;
  options?: string[];
  helper?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 ...">{label}</span>
      <div className="relative">
        <select className="..." value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((opt) => <option key={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 ..." />
      </div>
      {helper && <span className="mt-2 ...">{helper}</span>}
    </label>
  );
}
```

`LocalizationCard`:

```typescript
function LocalizationCard({
  values, onChange,
}: {
  values: CompanySettings;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <SectionCard className="p-6" index={3}>
      <CardTitle ... />
      <div className="space-y-5">
        <FormSelect label="Idioma"
          options={['es', 'en', 'fr']}
          value={values.language}
          onChange={(v) => onChange('language', v)}
        />
        <FormSelect label="Moneda principal"
          options={['DOP', 'USD', 'EUR']}
          value={values.currency}
          onChange={(v) => onChange('currency', v)}
        />
        <FormSelect label="Zona horaria"
          options={['America/Santo_Domingo', 'America/New_York', 'America/Puerto_Rico', 'UTC']}
          value={values.timezone}
          onChange={(v) => onChange('timezone', v)}
        />
        <FormSelect label="Formato de fecha"
          options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
          value={values.dateFormat}
          onChange={(v) => onChange('dateFormat', v)}
        />
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Agregar guardado al botón "Guardar cambios" en `SettingsPage`**

Cambiar `SettingsPage` para que los tabs expongan `onSavingChange`, y el botón llame a la API correspondiente:

```typescript
import {
  getCompanySettings, updateCompanySettings,
  getLoanDefaults, updateLoanDefaults,
  getNotificationSettings, updateNotificationSettings,
  getSecuritySettings, updateSecuritySettings,
} from '@/lib/api/settings';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [saving, setSaving] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<Record<string, unknown> | null>(null);
  const [loansDraft, setLoansDraft] = useState<Record<string, unknown> | null>(null);
  const [notificationsDraft, setNotificationsDraft] = useState<Record<string, unknown> | null>(null);
  const [securityDraft, setSecurityDraft] = useState<Record<string, unknown> | null>(null);
  const [version, setVersion] = useState(0);

  async function handleSave() {
    setSaving(true);
    try {
      if (activeTab === 'General' && generalDraft) {
        await updateCompanySettings(generalDraft as Parameters<typeof updateCompanySettings>[0]);
        setGeneralDraft(null);
        setVersion((v) => v + 1);
      }
      if (activeTab === 'Préstamos' && loansDraft) {
        await updateLoanDefaults(loansDraft as Parameters<typeof updateLoanDefaults>[0]);
        setLoansDraft(null);
        setVersion((v) => v + 1);
      }
      if (activeTab === 'Notificaciones' && notificationsDraft) {
        await updateNotificationSettings(notificationsDraft as Parameters<typeof updateNotificationSettings>[0]);
        setNotificationsDraft(null);
        setVersion((v) => v + 1);
      }
      if (activeTab === 'Seguridad' && securityDraft) {
        await updateSecuritySettings(securityDraft as Parameters<typeof updateSecuritySettings>[0]);
        setSecurityDraft(null);
        setVersion((v) => v + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="...">
      <SettingsHeader onSave={handleSave} saving={saving} />
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'General' && (
        <SettingsGeneralTab key={`general-${version}`}
          onDraftChange={setGeneralDraft}
        />
      )}
      {activeTab === 'Préstamos' && (
        <SettingsLoansTab key={`loans-${version}`}
          onDraftChange={setLoansDraft}
        />
      )}
      {activeTab === 'Notificaciones' && (
        <SettingsNotificationsTab key={`notifications-${version}`}
          onDraftChange={setNotificationsDraft}
        />
      )}
      {activeTab === 'Seguridad' && (
        <SettingsSecurityTab key={`security-${version}`}
          onDraftChange={setSecurityDraft}
        />
      )}
      {activeTab === 'Usuarios y roles' && <SettingsUsersRolesTab key="users-roles" />}
      {activeTab === 'Integraciones' && <EmptySettingsTab tab={activeTab} />}
    </main>
  );
}
```

`SettingsHeader` recibe `onSave` y `saving`:

```typescript
function SettingsHeader({
  onSave, saving,
}: {
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <motion.header ...>
      <div>
        <span className="inline-flex ...">Sistema</span>
        <h1 className="...">Configuración</h1>
        <p className="...">Ajusta los parámetros de tu sistema de préstamos.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="..." type="button">Cancelar</button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f7654] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.2)] transition hover:-translate-y-0.5 hover:bg-[#285c43] disabled:opacity-50"
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </motion.header>
  );
}
```

- [ ] **Step 3: Verificar que compile**

```bash
cd apps/frontend && npx next build 2>&1 | tail -20
```

Expected: Sin errores de compilación.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/settings/settings-page.tsx
git commit -m "feat: connect General settings tab to API"
```

---

### Task 8: Frontend — Conectar Tab Préstamos

**Files:**
- Modify: `apps/frontend/src/components/settings/settings-page.tsx`

- [ ] **Step 1: Refactor `DefaultLoanParametersCard` y `LoanProductsCard`**

`DefaultLoanParametersCard` recibe `values` y `onChange` de `LoanDefaults`:

```typescript
function DefaultLoanParametersCard({
  values,
  onChange,
}: {
  values: LoanDefaults;
  onChange: (key: string, value: string | boolean) => void;
}) {
  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <CardTitle icon={<Percent className="h-6 w-6" />} title="Parámetros por defecto"
        subtitle="Valores aplicados al crear un préstamo nuevo." />
      <div className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
        <FormInput label="Tasa de interés mensual" suffix="%"
          value={String(values.monthlyInterestRate)}
          onChange={(v) => onChange('monthlyInterestRate', v)} />
        <FormInput label="Mora por día de atraso" suffix="%"
          value={String(values.latePenaltyRate)}
          onChange={(v) => onChange('latePenaltyRate', v)} />
        <FormInput label="Plazo mínimo (meses)"
          value={String(values.minTerm)}
          onChange={(v) => onChange('minTerm', v)} />
        <FormInput label="Plazo máximo (meses)"
          value={String(values.maxTerm)}
          onChange={(v) => onChange('maxTerm', v)} />
        <FormInput label="Monto mínimo" prefix="RD$"
          value={String(values.minAmount)}
          onChange={(v) => onChange('minAmount', v)} />
        <FormInput label="Monto máximo" prefix="RD$"
          value={String(values.maxAmount)}
          onChange={(v) => onChange('maxAmount', v)} />
        <FormSelect label="Frecuencia de pago por defecto"
          options={['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']}
          value={values.paymentFrequency}
          onChange={(v) => onChange('paymentFrequency', v)} />
        <FormSelect label="Método de cálculo"
          options={['FLAT', 'REDUCING', 'COMPOUND', 'FIXED', 'INDEFINITE']}
          value={values.calculationMethod}
          onChange={(v) => onChange('calculationMethod', v)} />
      </div>
      <div className="mt-4">
        <SwitchRow title="Aprobación automática" description="Préstamos menores al monto mínimo se aprueban sin revisión."
          checked={values.autoApproval}
          onChange={(v) => onChange('autoApproval', v)} />
        <SwitchRow title="Requerir garante" description="Solicitar al menos un garante por cada préstamo nuevo."
          checked={values.requireGuarantor}
          onChange={(v) => onChange('requireGuarantor', v)} />
        <SwitchRow title="Generar amortización al crear" description="Crear automáticamente la tabla de cuotas al aprobar."
          bordered={false} checked={values.autoAmortization}
          onChange={(v) => onChange('autoAmortization', v)} />
      </div>
    </SectionCard>
  );
}
```

`ToggleSwitch` recibe `checked` y `onChange`:

```typescript
function ToggleSwitch({
  checked, onChange,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-[#18191D] shadow-[0_5px_12px_rgba(0,0,0,0.16)]' : 'bg-[#E1E3E6] shadow-[0_4px_10px_rgba(23,61,44,0.08)]'
      }`}
      onClick={() => onChange?.(!checked)}
      role="switch"
      type="button"
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition ${
        checked ? 'left-6' : 'left-1'
      }`} />
    </button>
  );
}
```

`SwitchRow` recibe `checked` y `onChange`:

```typescript
function SwitchRow({
  title, description, checked, bordered = true, onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  bordered?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-[#EDF2EF]' : ''}`}>
      <div>
        <p className="text-base font-bold text-[#173D2C]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#5C6D63]">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
```

- [ ] **Step 2: Conectar `SettingsLoansTab` a la API**

```typescript
import { getLoanDefaults, getLoanProducts, type LoanDefaults } from '@/lib/api/settings';

function SettingsLoansTab({
  onDraftChange,
}: {
  onDraftChange?: (draft: Record<string, unknown> | null) => void;
}) {
  const [settings, setSettings] = useState<LoanDefaults | null>(null);
  const [draft, setDraft] = useState<Partial<LoanDefaults>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoanDefaults()
      .then((data) => { setSettings(data); setDraft({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onDraftChange?.(Object.keys(draft).length > 0 ? draft : null);
  }, [draft, onDraftChange]);

  const patch = (key: string, value: string | boolean) => {
    const numValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
    setDraft((prev) => ({ ...prev, [key]: numValue }));
  };

  if (loading) return <p className="text-sm text-[#5C6D63]">Cargando...</p>;

  const merged = { ...(settings ?? {}), ...draft } as LoanDefaults;

  return (
    <motion.div ...>
      <DefaultLoanParametersCard values={merged} onChange={patch} />
      <LoanProductsCard />
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/settings/settings-page.tsx
git commit -m "feat: connect Loan defaults tab to API"
```

---

### Task 9: Frontend — Conectar Tab Notificaciones

**Files:**
- Modify: `apps/frontend/src/components/settings/settings-page.tsx`

- [ ] **Step 1: Refactor `SettingsNotificationsTab` con datos reales**

```typescript
import { getNotificationSettings, type NotificationSettings } from '@/lib/api/settings';

function SettingsNotificationsTab({
  onDraftChange,
}: {
  onDraftChange?: (draft: Record<string, unknown> | null) => void;
}) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [draft, setDraft] = useState<Partial<NotificationSettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationSettings()
      .then((data) => { setSettings(data); setDraft({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onDraftChange?.(Object.keys(draft).length > 0 ? draft : null);
  }, [draft, onDraftChange]);

  const patch = (key: string, value: string | number) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  if (loading) return <p className="text-sm text-[#5C6D63]">Cargando...</p>;

  const merged = { ...(settings ?? {}), ...draft } as NotificationSettings;

  return (
    <motion.div ...>
      <SectionCard className="p-6 lg:p-7" index={2}>
        <CardTitle icon={<Bell className="h-6 w-6" />} title="Alertas internas"
          subtitle="Avisos que recibe tu equipo dentro del sistema." />
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormInput label="Recordatorio de pago al cliente"
            helper="Días antes de la fecha de cuota."
            value={String(merged.paymentReminderDays)}
            onChange={(v) => patch('paymentReminderDays', Number(v))} />
          <FormInput label="Hora de envío diario"
            helper="Para resúmenes y alertas programadas."
            value={merged.dailySendTime}
            onChange={(v) => patch('dailySendTime', v)} />
        </div>
      </SectionCard>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/settings/settings-page.tsx
git commit -m "feat: connect Notifications settings tab to API"
```

---

### Task 10: Frontend — Conectar Tab Seguridad

**Files:**
- Modify: `apps/frontend/src/components/settings/settings-page.tsx`

- [ ] **Step 1: Refactor `SettingsSecurityTab` con datos reales**

```typescript
import { getSecuritySettings, type SecuritySettings } from '@/lib/api/settings';

function SettingsSecurityTab({
  onDraftChange,
}: {
  onDraftChange?: (draft: Record<string, unknown> | null) => void;
}) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [draft, setDraft] = useState<Partial<SecuritySettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSecuritySettings()
      .then((data) => { setSettings(data); setDraft({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onDraftChange?.(Object.keys(draft).length > 0 ? draft : null);
  }, [draft, onDraftChange]);

  const patch = (key: string, value: string | number) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  if (loading) return <p className="text-sm text-[#5C6D63]">Cargando...</p>;

  const merged = { ...(settings ?? {}), ...draft } as SecuritySettings;

  return (
    <motion.div ...>
      <SectionCard className="p-6 lg:p-7" index={2}>
        <CardTitle icon={<KeyRound className="h-6 w-6" />} title="Acceso y autenticación"
          subtitle="Controla cómo inician sesión los usuarios." />
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormInput label="Longitud mínima de contraseña"
            value={String(merged.minPasswordLength)}
            onChange={(v) => patch('minPasswordLength', Number(v))} />
          <FormInput label="Caducidad de contraseña (días)"
            value={String(merged.passwordExpiryDays)}
            onChange={(v) => patch('passwordExpiryDays', Number(v))} />
        </div>
      </SectionCard>
      <SectionCard className="p-6 lg:p-7" index={3}>
        <CardTitle icon={<ShieldCheck className="h-6 w-6" />} title="Respaldos"
          subtitle="Resguarda tu información de forma automática." />
        <p className="py-6 text-center text-sm font-medium text-[#5C6D63]">Los respaldos se gestionan desde la infraestructura.</p>
      </SectionCard>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/settings/settings-page.tsx
git commit -m "feat: connect Security settings tab to API"
```

---

### Task 11: Verificación final

- [ ] **Step 1: Build backend**

```bash
cd apps/backend && npx nest build
```

Expected: `Found 0 errors`

- [ ] **Step 2: Build frontend**

```bash
cd apps/frontend && npx next build 2>&1 | tail -20
```

Expected: Build successful, no errors.

- [ ] **Step 3: Iniciar servidores y probar**

```bash
# En otra terminal: backend
cd apps/backend && pnpm start:dev

# En otra terminal: frontend
cd apps/frontend && pnpm dev
```

Abrir `http://localhost:3001/configuracion` y verificar:
- Tab General carga datos y permite guardar
- Tab Préstamos carga defaults
- Tab Notificaciones carga configuración
- Tab Seguridad carga configuración
- Botón Guardar cambios persiste los datos
- Usuarios y roles sigue funcionando
