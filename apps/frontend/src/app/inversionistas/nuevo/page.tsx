'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, FileText, TrendingUp, Calendar, Camera, Save, UserPlus, X, Calculator } from 'lucide-react';
import { createInvestor, getInvestor, updateInvestor } from '@/lib/api/investors';
import { compressImage } from '@/lib/compress-image';
import { invalidateCache } from '@/lib/use-client-cache';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { getNextMonthIsoDate } from '@/components/ui/date-picker.helpers';
import { calculateMonthlyInterest, formatDopCurrency } from '@/components/investors/investor-calculation.helpers';
import { getApiErrorMessage, getInvestorNameValidationError } from '@/components/investors/investor-form.helpers';

function maskCedula(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function cleanCedula(value: string): string {
  return value.replace(/\D/g, '');
}

function cleanPhone(value: string): string {
  return value.replace(/\D/g, '');
}

function formatIntegerAmount(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseIntegerAmount(value: string): number {
  return Number(value.replace(/,/g, '')) || 0;
}

function toDateInputValue(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function StepIndicator({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <div className="flex items-center gap-2.5">
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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 } }),
};

function MotionCard({ children, className = '', index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={index} className={className}>
      {children}
    </motion.div>
  );
}

function FormSection({
  icon,
  title,
  description,
  accent,
  children,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-7 xl:p-8">
      <div className="mb-6 flex items-center justify-between gap-6 xl:mb-7">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent }}>
              {icon}
            </div>
          )}
          <div>
            <p className="text-lg font-bold leading-tight text-neutral-900">{title}</p>
            <p className="mt-1 text-sm text-neutral-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-5 xl:space-y-6">{children}</div>
    </div>
  );
}

function Field({ label, htmlFor, hint, full, children }: { label: string; htmlFor: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? '' : 'grid items-start gap-3 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]'}>
      <div className={full ? 'mb-1' : 'pt-3'}>
        <label htmlFor={htmlFor} className="text-sm font-bold text-neutral-600">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputClass = 'h-14 w-full rounded-xl border border-neutral-200 bg-white px-5 text-base outline-none focus:border-[#7fb89a] focus:ring-2 focus:ring-[#c2dfcb]/60';

function ProfilePhotoInput({ photo, onPhotoChange }: { photo: string | null; onPhotoChange: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const compressed = await compressImage(file, 800, 0.7);
    onPhotoChange(URL.createObjectURL(compressed));
  };

  return (
    <div className="shrink-0 text-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#c2dfcb] bg-[#eaf5ed] shadow-sm transition hover:border-[#7fb89a] hover:shadow-md xl:h-[72px] xl:w-[72px]"
        aria-label={photo ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
      >
        {photo ? (
          <div
            aria-label="Foto de perfil"
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${photo})` }}
          />
        ) : (
          <Camera className="h-6 w-6 text-[#5a9a7a]" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-[#173D2C]/72 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
          {photo ? 'Cambiar' : 'Subir'}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {photo && (
        <button
          type="button"
          onClick={() => onPhotoChange(null)}
          className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600"
        >
          Quitar foto
        </button>
      )}
    </div>
  );
}

function AddInvestorForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [monthlyInterest, setMonthlyInterest] = useState<number | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', cedula: '', birthDate: '', nationality: '', type: 'individual',
    phone: '', phone2: '', email: '',
    capital: '', rate: '', frequency: 'mensual',
    startDate: getNextMonthIsoDate(), term: '12m', bank: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const searchParams = useSearchParams();
  const prefilledId = searchParams.get('investorId');

  useEffect(() => {
    if (!prefilledId) return;
    getInvestor(prefilledId).then((inv) => {
      if (!inv) return;
      const [firstName = '', ...rest] = inv.name.split(' ');
      setForm((f) => ({
        ...f,
        firstName,
        lastName: rest.join(' ') || '',
        cedula: inv.cedula || '',
        phone: inv.phone || '',
        phone2: inv.phone2 || '',
        email: inv.email || '',
        nationality: inv.nationality || '',
        type: inv.type || 'individual',
        birthDate: toDateInputValue(inv.birthDate),
        capital: formatIntegerAmount(String(inv.capital ?? '')),
        rate: String(inv.rate ?? ''),
        startDate: toDateInputValue(inv.startDate) || getNextMonthIsoDate(),
        term: inv.term || '12m',
        bank: inv.bank || '',
        notes: inv.notes || '',
      }));
      setPhoto(inv.photo || null);
      setStep(2);
    }).catch(() => {});
  }, [prefilledId]);

  const handleCalculateInterest = () => {
    setMonthlyInterest(calculateMonthlyInterest(parseIntegerAmount(form.capital), Number(form.rate)));
  };

  const handleSave = async (andNew: boolean) => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const validationError = getInvestorNameValidationError(form.firstName, form.lastName);

    if (validationError) {
      setError(validationError);
      setStep(1);
      return;
    }

    setSaving(true);
    setError(null);
    const capital = parseIntegerAmount(form.capital);
    const calculatedMonthlyInterest = calculateMonthlyInterest(capital, Number(form.rate));
    try {
      const payload = {
        name,
        email: form.email || undefined,
        phone: cleanPhone(form.phone) || undefined,
        phone2: cleanPhone(form.phone2) || undefined,
        cedula: cleanCedula(form.cedula) || undefined,
        birthDate: form.birthDate || undefined,
        nationality: form.nationality || undefined,
        type: form.type,
        photo: photo || undefined,
        capital,
        monthlyPayment: calculatedMonthlyInterest ?? 0,
        rate: Number(form.rate) || 0,
        startDate: form.startDate || undefined,
        term: form.term,
        bank: form.bank || undefined,
        notes: form.notes || undefined,
      };

      if (prefilledId) {
        await updateInvestor(prefilledId, payload);
      } else {
        await createInvestor(payload);
      }
      invalidateCache('investors');
      if (andNew) {
        setForm({ firstName: '', lastName: '', cedula: '', birthDate: '', nationality: '', type: 'individual', phone: '', phone2: '', email: '', capital: '', rate: '', frequency: 'mensual', startDate: getNextMonthIsoDate(), term: '12m', bank: '', notes: '' });
        setPhoto(null);
        setMonthlyInterest(null);
      } else {
        router.push('/inversionistas');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al guardar el inversionista'));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-5 lg:px-8 lg:py-6 xl:px-10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/inversionistas" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-700">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a inversionistas
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 lg:text-[34px]">
              {prefilledId ? 'Editar inversionista' : step === 1 ? 'Agregar inversionista' : 'Condiciones de inversión'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2.5 md:justify-end">
            {step === 1 ? (
              <>
                <button onClick={() => router.push('/inversionistas')} className="h-12 rounded-full border border-neutral-200 bg-white px-5 text-base font-bold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-2">
                  <X className="h-4 w-4" />Cancelar
                </button>
                <button onClick={() => setStep(2)} className="h-12 rounded-full bg-[#5a9a7a] px-7 text-base font-bold text-white shadow-sm hover:bg-[#4a866a] inline-flex items-center gap-2">
                  Siguiente <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/inversionistas')} className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
                  <X className="h-4 w-4" />Cancelar
                </button>
                <button onClick={() => setStep(1)} className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />Atrás
                </button>
                {!prefilledId && (
                  <button onClick={() => handleSave(true)} disabled={saving} className="h-11 rounded-full border border-[#c2dfcb] bg-[#eaf5ed] px-4 text-sm font-semibold text-[#5a9a7a] hover:bg-[#c2dfcb]/60 disabled:opacity-50 inline-flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" />Guardar y nuevo
                  </button>
                )}
                <button onClick={() => handleSave(false)} disabled={saving} className="h-11 rounded-full bg-[#5a9a7a] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4a866a] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <Save className="h-4 w-4" />{saving ? 'Guardando...' : prefilledId ? 'Actualizar inversionista' : 'Guardar inversionista'}
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

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-8">
                <MotionCard index={0}>
                  <FormSection
                    title="Datos personales"
                    description="Información de identificación del inversionista."
                    accent="#eaf5ed"
                    action={<ProfilePhotoInput photo={photo} onPhotoChange={setPhoto} />}
                  >
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
                    <Field label="Correo electrónico" htmlFor="inv-email">
                      <input id="inv-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="inversionista@correo.com" className={inputClass} />
                    </Field>
                  </FormSection>
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
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <MotionCard index={0}>
                  <FormSection icon={<TrendingUp className="h-5 w-5 text-[#a16207]" />} title="Condiciones" description="Capital e inversión." accent="#fef3c7">
                    <Field label="Capital inicial (RD$)" htmlFor="inv-capital" hint="Monto de inicio">
                      <input
                        id="inv-capital"
                        inputMode="numeric"
                        value={formatIntegerAmount(form.capital)}
                        onChange={(e) => {
                          set('capital', e.target.value.replace(/\D/g, ''));
                          setMonthlyInterest(null);
                        }}
                        placeholder="500,000"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Tasa de retorno (%)" htmlFor="inv-rate">
                      <input
                        id="inv-rate"
                        type="number"
                        value={form.rate}
                        onChange={(e) => {
                          set('rate', e.target.value);
                          setMonthlyInterest(null);
                        }}
                        placeholder="12"
                        className={inputClass}
                      />
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
                  </FormSection>
                </MotionCard>

                <MotionCard index={1}>
                  <div className="space-y-4">
                    <FormSection icon={<Calendar className="h-5 w-5 text-[#6d28d9]" />} title="Plazo" description="Vigencia de la inversión." accent="#e9e2f5">
                      <Field label="Fecha de inicio" htmlFor="inv-start">
                        <DatePickerInput id="inv-start" value={form.startDate} onChange={(value) => set('startDate', value)} className={inputClass} />
                      </Field>
                    </FormSection>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleCalculateInterest}
                        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#5a9a7a] px-8 text-base font-bold text-white shadow-sm transition hover:bg-[#4f8d6f]"
                      >
                        <Calculator className="h-5 w-5" />
                        Calcular
                      </button>
                      {monthlyInterest !== null && (
                        <div className="rounded-xl border border-[#c2dfcb] bg-[#f3faf6] px-5 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#6f8076]">Interés mensual</p>
                          <p className="text-xl font-bold text-[#173D2C]">{formatDopCurrency(monthlyInterest)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </MotionCard>

                <MotionCard index={2} className="lg:col-span-2">
                  <FormSection icon={<FileText className="h-5 w-5 text-[#5a9a7a]" />} title="Notas y observaciones" description="Acuerdos, condiciones especiales o historial previo." accent="#c2dfcb">
                    <Field label="Comentarios" htmlFor="inv-notes" full>
                      <textarea id="inv-notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Condiciones especiales, acuerdos verbales, historial previo..." className="w-full rounded-xl border-neutral-200 bg-white text-sm p-3.5 outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a] border resize-none" />
                    </Field>
                  </FormSection>
                </MotionCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex justify-end">
          <StepIndicator step={step} onStep={setStep} />
        </div>
      </div>
    </div>
  );
}

export default function AddInvestorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]"><p className="text-sm text-neutral-400">Cargando...</p></div>}>
      <AddInvestorForm />
    </Suspense>
  );
}
