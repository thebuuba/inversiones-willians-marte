# Add Investor Wizard — Implementation Plan

> **For agentic workers:** Use the subagent-driven-development or executing-plans skill to implement this plan task-by-task.

**Goal:** Convert the single-page add-investor form into a 2-step wizard with progress bar and animated transitions.

**Architecture:** Single file (`page.tsx`) with a `step` state (1 or 2) controlling which section renders. Progress bar component added inline. Framer Motion `AnimatePresence` for step transitions.

**Tech Stack:** Next.js App Router, React useState, Framer Motion, Tailwind CSS v4

---

### Task 1: Add step state, progress bar, and conditional rendering

**Files:**
- Modify: `apps/frontend/src/app/inversionistas/nuevo/page.tsx`

- [ ] **Step 1: Add `step` state and StepIndicator component**

After the `cleanPhone` function and before `cardVariants`, add the step indicator component:

```tsx
function StepIndicator({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Paso {step} de 2
      </span>
      <div className="flex gap-1.5">
        {[1, 2].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStep(s)}
            className={`h-2 rounded-full transition-all ${
              s === step ? 'w-8 bg-[#5a9a7a]' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `step` state to the component**

Inside `AddInvestorPage`, add after `const [error, setError] = useState<string | null>(null);`:

```tsx
const [step, setStep] = useState(1);
```

- [ ] **Step 3: Wrap the main content area with AnimatePresence**

Import `AnimatePresence` from framer-motion at the top:

```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

Remove `import type { Variants } from 'framer-motion';` (merge into the line above).

Replace the current two-column grid (`<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">` through its closing `</div>`) with conditional rendering:

```tsx
<AnimatePresence mode="wait">
  {step === 1 ? (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <MotionCard index={0}>
          <FormSection icon={<User className="h-5 w-5 text-[#5a9a7a]" />} title="Datos personales" description="Información de identificación del inversionista." accent="#eaf5ed">
            <Field label="Nombres" htmlFor="inv-first">
              <input id="inv-first" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Juan Carlos" className={inputClass} />
            </Field>
            <Field label="Apellidos" htmlFor="inv-last">
              <input id="inv-last" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Pérez Montero" className={inputClass} />
            </Field>
            <Field label="Cédula / Documento" htmlFor="inv-cedula">
              <input id="inv-cedula" value={form.cedula} onChange={(e) => set('cedula', maskCedula(e.target.value))} placeholder="000-0000000-0" className={inputClass} maxLength={13} />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="inv-dob">
              <input id="inv-dob" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Nacionalidad" htmlFor="inv-nat">
              <input id="inv-nat" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Dominicana" className={inputClass} />
            </Field>
            <Field label="Tipo de inversionista" htmlFor="inv-type">
              <select id="inv-type" value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                <option value="individual">Individual</option>
                <option value="empresa">Empresa</option>
                <option value="familiar">Familiar</option>
                <option value="institucional">Institucional</option>
              </select>
            </Field>
          </FormSection>
        </MotionCard>

        <MotionCard index={1}>
          <FormSection icon={<Phone className="h-5 w-5 text-[#3b82f6]" />} title="Información de contacto" description="Cómo comunicarse con el inversionista." accent="#dbeafe">
            <Field label="Teléfono móvil" htmlFor="inv-phone">
              <input id="inv-phone" value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(000) 000-0000" className={inputClass} maxLength={15} />
            </Field>
            <Field label="Teléfono alternativo" htmlFor="inv-phone2">
              <input id="inv-phone2" value={form.phone2} onChange={(e) => set('phone2', maskPhone(e.target.value))} placeholder="(000) 000-0000" className={inputClass} maxLength={15} />
            </Field>
            <Field label="Correo electrónico" htmlFor="inv-email" full>
              <input id="inv-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="inversionista@correo.com" className={inputClass} />
            </Field>
          </FormSection>
        </MotionCard>

        <MotionCard index={2}>
          <PhotoUpload photo={photo} onPhotoChange={setPhoto} />
        </MotionCard>
      </div>
    </motion.div>
  ) : (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <MotionCard index={0}>
          <FormSection icon={<TrendingUp className="h-5 w-5 text-[#a16207]" />} title="Condiciones" description="Capital e inversión." accent="#fef3c7">
            <Field label="Capital inicial (RD$)" htmlFor="inv-capital" hint="Monto de inicio">
              <input id="inv-capital" type="number" value={form.capital} onChange={(e) => set('capital', e.target.value)} placeholder="500,000" className={inputClass} />
            </Field>
            <Field label="Tasa de retorno (%)" htmlFor="inv-rate">
              <input id="inv-rate" type="number" value={form.rate} onChange={(e) => set('rate', e.target.value)} placeholder="12" className={inputClass} />
            </Field>
            <Field label="Frecuencia de pago" htmlFor="inv-freq">
              <select id="inv-freq" value={form.frequency} onChange={(e) => set('frequency', e.target.value)} className={inputClass}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="al-vencimiento">Al vencimiento</option>
              </select>
            </Field>
            <Field label="Banco / Cuenta" htmlFor="inv-bank">
              <input id="inv-bank" value={form.bank} onChange={(e) => set('bank', e.target.value)} placeholder="Banco Popular" className={inputClass} />
            </Field>
          </FormSection>
        </MotionCard>

        <MotionCard index={1}>
          <FormSection icon={<Calendar className="h-5 w-5 text-[#6d28d9]" />} title="Plazo" description="Vigencia de la inversión." accent="#e9e2f5">
            <Field label="Fecha de inicio" htmlFor="inv-start">
              <input id="inv-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Plazo pactado" htmlFor="inv-term">
              <select id="inv-term" value={form.term} onChange={(e) => set('term', e.target.value)} className={inputClass}>
                <option value="6m">6 meses</option>
                <option value="12m">12 meses</option>
                <option value="18m">18 meses</option>
                <option value="24m">24 meses</option>
                <option value="indefinido">Indefinido</option>
              </select>
            </Field>
          </FormSection>
        </MotionCard>

        <MotionCard index={2}>
          <FormSection icon={<FileText className="h-5 w-5 text-[#5a9a7a]" />} title="Notas y observaciones" description="Acuerdos, condiciones especiales o historial previo." accent="#c2dfcb">
            <Field label="Comentarios" htmlFor="inv-notes" full>
              <textarea id="inv-notes" rows={5} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Condiciones especiales, acuerdos verbales, historial previo..." className="w-full rounded-xl border-neutral-200 bg-white text-sm p-4 outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a] border resize-none" />
            </Field>
          </FormSection>
        </MotionCard>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 4: Update the header section**

Replace the current header section inside `<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">` (from the opening div through its closing `</div>`) with:

```tsx
<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
  <div>
    <Link href="/inversionistas" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5a9a7a] hover:text-[#7fb89a]">
      <ArrowLeft className="h-3.5 w-3.5" />
      Volver a inversionistas
    </Link>
    <div className="mb-1 flex items-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#7fb89a]">Captación</p>
      <StepIndicator step={step} onStep={setStep} />
    </div>
    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
      {step === 1 ? 'Agregar inversionista' : 'Condiciones de inversión'}
    </h1>
    <p className="mt-1 text-sm text-neutral-500">
      {step === 1
        ? 'Registra un nuevo inversionista en tu cartera de capital.'
        : 'Define el capital, plazo y condiciones de la inversión.'}
    </p>
  </div>
  <div className="flex flex-wrap gap-2">
    {step === 1 ? (
      <>
        <button onClick={() => router.push('/inversionistas')} className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <X className="h-4 w-4" />Cancelar
        </button>
        <button onClick={() => setStep(2)} className="h-11 rounded-full bg-[#5a9a7a] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#4a866a] inline-flex items-center gap-1.5">
          Siguiente <ArrowLeft className="h-4 w-4 rotate-180" />
        </button>
      </>
    ) : (
      <>
        <button onClick={() => router.push('/inversionistas')} className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <X className="h-4 w-4" />Cancelar
        </button>
        <button onClick={() => setStep(1)} className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />Atrás
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} className="h-11 rounded-full border border-[#c2dfcb] bg-[#eaf5ed] px-5 text-sm font-semibold text-[#5a9a7a] hover:bg-[#c2dfcb]/60 disabled:opacity-50 inline-flex items-center gap-1.5">
          <UserPlus className="h-4 w-4" />Guardar y nuevo
        </button>
        <button onClick={() => handleSave(false)} disabled={saving} className="h-11 rounded-full bg-[#5a9a7a] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#4a866a] disabled:opacity-50 inline-flex items-center gap-1.5">
          <Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar inversionista'}
        </button>
      </>
    )}
  </div>
  {error && (
    <div className="w-full rounded-xl border border-[#fde4d4] bg-[#fff5f0] px-5 py-3 text-sm font-medium text-[#c2410c]">
      {error}
    </div>
  )}
</div>
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit --pretty`
Expected: no output (no errors)
