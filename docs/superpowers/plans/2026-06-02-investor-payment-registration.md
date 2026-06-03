# Investor Payment Registration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** Build a two-column page at `/inversionistas/pago?investorId=xxx` to register interest payments to investors.

**Architecture:** New `InvestorPayment` Prisma model + `InvestorPaymentsModule` (NestJS) + page component (Next.js App Router). Follows existing `PaymentsModule` pattern.

**Tech Stack:** Prisma, NestJS, Next.js 16, Tailwind CSS

---

### Task 1: Prisma Schema — Add InvestorPayment model

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add the model**

Add after the `Investor` model (after line 335):

```prisma
// ─── Investor Payments ──────────────────────────────────────────

model InvestorPayment {
  id            String   @id @default(uuid())
  investorId    String   @map("investor_id")
  amount        Decimal
  periodMonth   Int      @map("period_month")
  periodYear    Int      @map("period_year")
  paymentDate   DateTime @map("payment_date")
  paymentMethod String?  @map("payment_method")
  reference     String?
  notes         String?
  receivedById  String   @map("received_by")
  createdAt     DateTime @default(now()) @map("created_at")

  investor   Investor @relation(fields: [investorId], references: [id])
  receivedBy User     @relation(fields: [receivedById], references: [id])

  @@unique([investorId, periodMonth, periodYear])
  @@index([investorId])
  @@index([paymentDate])
  @@map("investor_payments")
}
```

**Step 2: Run migration**

```bash
pnpm db:migrate --name add_investor_payments
```

**Step 3: Generate Prisma client**

```bash
pnpm db:generate
```

---

### Task 2: Shared types — Add interfaces

**Files:**
- Modify: `packages/shared/src/index.ts`

**Step 1: Add types after the `InvestorItem` block**

```typescript
export interface CreateInvestorPaymentDto {
  investorId: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface InvestorPaymentItem {
  id: string;
  investorId: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  receivedById: string;
  createdAt: string;
}
```

---

### Task 3: Backend — InvestorPaymentsModule

**Files:**
- Create: `apps/backend/src/modules/investor-payments/dto/create-investor-payment.dto.ts`
- Create: `apps/backend/src/modules/investor-payments/investor-payments.service.ts`
- Create: `apps/backend/src/modules/investor-payments/investor-payments.controller.ts`
- Create: `apps/backend/src/modules/investor-payments/investor-payments.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Step 1: Create DTO**

`apps/backend/src/modules/investor-payments/dto/create-investor-payment.dto.ts`:

```typescript
import { IsString, IsNumber, IsInt, IsOptional, Min, Max, MinLength } from 'class-validator';

export class CreateInvestorPaymentDto {
  @IsString()
  investorId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  periodYear: number;

  @IsString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Step 2: Create Service**

`apps/backend/src/modules/investor-payments/investor-payments.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';

@Injectable()
export class InvestorPaymentsService {
  async create(dto: CreateInvestorPaymentDto, userId: string) {
    const investor = await prisma.investor.findUnique({ where: { id: dto.investorId } });
    if (!investor) throw new NotFoundException('Investor not found');

    try {
      return await prisma.investorPayment.create({
        data: {
          investorId: dto.investorId,
          amount: dto.amount,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          receivedById: userId,
        },
        include: { receivedBy: { select: { id: true, name: true } } },
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
        throw new BadRequestException('This period is already paid for this investor');
      }
      throw error;
    }
  }

  async findByInvestor(investorId: string) {
    return prisma.investorPayment.findMany({
      where: { investorId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  async checkPeriod(investorId: string, periodMonth: number, periodYear: number) {
    return prisma.investorPayment.findFirst({
      where: { investorId, periodMonth, periodYear },
    });
  }
}
```

**Step 3: Create Controller**

`apps/backend/src/modules/investor-payments/investor-payments.controller.ts`:

```typescript
import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InvestorPaymentsService } from './investor-payments.service';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('investor-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorPaymentsController {
  constructor(private service: InvestorPaymentsService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreateInvestorPaymentDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get(':investorId')
  @Roles('ADMIN', 'COLLECTOR')
  findByInvestor(@Param('investorId') investorId: string) {
    return this.service.findByInvestor(investorId);
  }

  @Get('check')
  @Roles('ADMIN', 'COLLECTOR')
  checkPeriod(
    @Query('investorId') investorId: string,
    @Query('periodMonth') periodMonth: string,
    @Query('periodYear') periodYear: string,
  ) {
    return this.service.checkPeriod(investorId, Number(periodMonth), Number(periodYear));
  }
}
```

**Step 4: Create Module**

`apps/backend/src/modules/investor-payments/investor-payments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { InvestorPaymentsController } from './investor-payments.controller';
import { InvestorPaymentsService } from './investor-payments.service';

@Module({
  controllers: [InvestorPaymentsController],
  providers: [InvestorPaymentsService],
})
export class InvestorPaymentsModule {}
```

**Step 5: Register in AppModule**

Add import to `apps/backend/src/app.module.ts`:

```typescript
import { InvestorPaymentsModule } from './modules/investor-payments/investor-payments.module';
```

Add to the `imports` array: `InvestorPaymentsModule,`

---

### Task 4: Frontend — API client

**Files:**
- Create: `apps/frontend/src/lib/api/investor-payments.ts`

**Step 1: Create the API client**

```typescript
import { api } from '../api';
import type { ApiResponse, CreateInvestorPaymentDto, InvestorPaymentItem } from '@inversiones/shared';

export async function createInvestorPayment(dto: CreateInvestorPaymentDto): Promise<InvestorPaymentItem> {
  const { data } = await api.post<ApiResponse<InvestorPaymentItem>>('/investor-payments', dto);
  return data.data as InvestorPaymentItem;
}

export async function getInvestorPayments(investorId: string): Promise<InvestorPaymentItem[]> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem[]>>(`/investor-payments/${investorId}`);
  return data.data ?? [];
}

export async function checkInvestorPaymentPeriod(investorId: string, periodMonth: number, periodYear: number): Promise<InvestorPaymentItem | null> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem | null>>('/investor-payments/check', {
    params: { investorId, periodMonth, periodYear },
  });
  return data.data ?? null;
}
```

---

### Task 5: Frontend — Component

**Files:**
- Create: `apps/frontend/src/components/investors/register-investor-payment-page.tsx`

**Step 1: Create the component**

This is a `'use client'` component with two columns. Following the existing design patterns from `investor-detail-page.tsx` and `register-payment-modal.tsx`.

```typescript
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Banknote, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { getInvestor } from '@/lib/api/investors';
import { createInvestorPayment, checkInvestorPaymentPeriod, getInvestorPayments } from '@/lib/api/investor-payments';
import type { InvestorItem, InvestorPaymentItem } from '@inversiones/shared';

const fmt = (n: number) => `RD$${n.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;
const fmtDate = (s: string | Date) => new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'];

const inputClass = 'h-11 w-full rounded-xl border border-[#ddebe3] bg-white px-4 text-sm font-medium text-[#173d2c] outline-none transition focus:border-[#5fa37d]';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function RegisterInvestorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investorId = searchParams.get('investorId');

  const [investor, setInvestor] = useState<InvestorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<InvestorPaymentItem[]>([]);
  const [periodPaid, setPeriodPaid] = useState<InvestorPaymentItem | null>(null);
  const [checkingPeriod, setCheckingPeriod] = useState(false);

  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!investorId) {
      router.replace('/inversionistas');
      return;
    }
    Promise.all([
      getInvestor(investorId),
      getInvestorPayments(investorId).catch(() => [] as InvestorPaymentItem[]),
    ])
      .then(([inv, p]) => {
        setInvestor(inv);
        setPayments(p);
      })
      .catch(() => setInvestor(null))
      .finally(() => setLoading(false));
  }, [investorId, router]);

  const cuota = investor ? Math.round(Number(investor.capital) * Number(investor.rate) / 100) : 0;

  useEffect(() => {
    if (!investorId || !investor) return;
    setCheckingPeriod(true);
    checkInvestorPaymentPeriod(investorId, periodMonth, periodYear)
      .then((p) => {
        setPeriodPaid(p);
        if (!p) setAmount(String(cuota));
      })
      .catch(() => setPeriodPaid(null))
      .finally(() => setCheckingPeriod(false));
  }, [investorId, periodMonth, periodYear, investor, cuota]);

  if (!investorId) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Cargando...</p>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Inversionista no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-[#5a9a7a] underline" href="/inversionistas">
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const amountNumber = Number(amount);
  const invalidAmount = submitted && (!Number.isFinite(amountNumber) || amountNumber <= 0);
  const invalidDate = submitted && !paymentDate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !paymentDate) return;

    setSaving(true);
    try {
      await createInvestorPayment({
        investorId,
        amount: amountNumber,
        periodMonth,
        periodYear,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.push(`/inversionistas/${investorId}`);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String((err as { response: { data: { message?: string } } }).response.data.message ?? 'Error al registrar el pago')
          : 'Error al registrar el pago';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans">
      <div className="mx-auto max-w-7xl">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5a9a7a] hover:text-[#7fb89a]"
          href={`/inversionistas/${investorId}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a inversionista
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          {/* Left column: Investor info */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5ed]">
                  <TrendingUp className="h-7 w-7 text-[#5a9a7a]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">{investor.name}</h2>
                  <p className="text-sm text-neutral-500">{investor.code}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#eaf5ed] px-3 py-0.5 text-xs font-semibold text-[#5a9a7a]">
                    {investor.status === 'ACTIVE' ? 'Activo' : investor.status === 'PAUSED' ? 'Pausado' : 'Retirado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900">Información financiera</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs text-neutral-500">Capital invertido</span>
                  <span className="text-sm font-bold text-neutral-900">{fmt(Number(investor.capital))}</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs text-neutral-500">Tasa mensual</span>
                  <span className="text-sm font-bold text-neutral-900">{Number(investor.rate)}%</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs text-neutral-500">Retorno mensual</span>
                  <span className="text-sm font-bold text-[#5a9a7a]">{fmt(cuota)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs text-neutral-500">Período</span>
                  <span className="text-sm font-bold text-neutral-900">{MONTHS[periodMonth - 1]} {periodYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Estado del período</span>
                  {checkingPeriod ? (
                    <span className="text-sm font-medium text-neutral-400">Verificando...</span>
                  ) : periodPaid ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#5a9a7a]">
                      <CheckCircle2 className="h-4 w-4" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#a16207]">
                      <Clock className="h-4 w-4" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900">Últimos pagos</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-neutral-400">No hay pagos registrados aún.</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{MONTHS[p.periodMonth - 1]} {p.periodYear}</p>
                        <p className="text-xs text-neutral-400">{fmtDate(p.paymentDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-[#5a9a7a]">{fmt(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Payment form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
            <h2 className="mb-1 text-xl font-bold text-neutral-900">Registrar pago de interés</h2>
            <p className="mb-6 text-sm text-neutral-500">Registra el pago mensual correspondiente al período seleccionado.</p>

            {periodPaid ? (
              <div className="rounded-xl bg-[#eaf5ed] p-5 border border-[#c2dfcb]/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#5a9a7a]" />
                  <p className="font-semibold text-[#5a9a7a]">Período ya pagado</p>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  El período {MONTHS[periodMonth - 1]} {periodYear} ya fue registrado por <strong>{fmt(Number(periodPaid.amount))}</strong> el {fmtDate(periodPaid.paymentDate)}.
                </p>
                {periodPaid.paymentMethod && (
                  <p className="mt-1 text-sm text-neutral-500">Método: {periodPaid.paymentMethod}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Período</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select className={inputClass} value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                      </select>
                      <select className={inputClass} value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))}>
                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Monto</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6f8076]">RD$</span>
                      <input
                        className={`${inputClass} pl-14 ${invalidAmount ? 'border-[#e4a58b]' : ''}`}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Fecha del pago</span>
                    <input
                      className={`${inputClass} ${invalidDate ? 'border-[#e4a58b]' : ''}`}
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Método de pago</span>
                    <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      {METHODS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Referencia</span>
                    <input
                      className={inputClass}
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-[#5c6d63]">Notas</span>
                    <textarea
                      className="h-24 w-full resize-none rounded-xl border border-[#ddebe3] bg-white px-4 py-3 text-sm font-medium text-[#173d2c] outline-none transition focus:border-[#5fa37d]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>

                  {error && (
                    <p className="text-sm font-medium text-[#c96f4a] sm:col-span-2">{error}</p>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-[#edf2ef] pt-4">
                  <Link
                    className="inline-flex h-11 items-center rounded-full border border-[#ddebe3] bg-white px-6 text-sm font-bold text-[#173d2c]"
                    href={`/inversionistas/${investorId}`}
                  >
                    Cancelar
                  </Link>
                  <button
                    className="inline-flex h-11 items-center rounded-full bg-[#285c43] px-6 text-sm font-bold text-white disabled:opacity-60"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? 'Registrando...' : 'Registrar pago'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 6: Frontend — Page route

**Files:**
- Create: `apps/frontend/src/app/inversionistas/pago/page.tsx`

**Step 1: Create the page**

```typescript
import { Suspense } from 'react';
import { RegisterInvestorPaymentPage } from '@/components/investors/register-investor-payment-page';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans"><p className="text-sm font-medium text-neutral-400">Cargando...</p></div>}>
      <RegisterInvestorPaymentPage />
    </Suspense>
  );
}
```

Note: `useSearchParams()` requires `Suspense` boundary in Next.js App Router.

---

### Task 7: Update investor detail "Registrar pago" link

**Files:**
- Modify: `apps/frontend/src/components/investors/investor-detail-page.tsx`

**Step 1: Add investorId to the link**

Line 194-195 currently has:
```tsx
href="/inversionistas/pago"
```

Change to:
```tsx
href={`/inversionistas/pago?investorId=${investorId}`}
```

---

### Task 8: Build & verify

**Steps:**

```bash
pnpm db:generate
pnpm --filter @inversiones/backend build
pnpm --filter @inversiones/frontend build
```

Check for any TypeScript errors. Fix them.

```bash
pnpm dev
```
