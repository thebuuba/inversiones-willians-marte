'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, FileText, TrendingUp, Calendar, Camera, Upload, Trash2, Save, UserPlus, X, Image } from 'lucide-react';
import { createInvestor } from '@/lib/api/investors';
import { compressImage } from '@/lib/compress-image';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

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

function FormSection({ icon, title, description, accent, children }: { icon: React.ReactNode; title: string; description: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: accent }}>{icon}</div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="text-xs text-neutral-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, htmlFor, required, hint, full, children }: { label: string; htmlFor: string; required?: boolean; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? '' : 'grid grid-cols-[140px_1fr] gap-3 items-start'}>
      <div className={full ? 'mb-1' : 'pt-2'}>
        <label htmlFor={htmlFor} className="text-xs font-semibold text-neutral-600">
          {label} {required && <span className="text-[#7fb89a]">*</span>}
        </label>
        {hint && <p className="mt-0.5 text-[10px] text-neutral-400">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputClass = 'h-11 w-full rounded-xl border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a] border';

function PhotoUpload({ photo, onPhotoChange }: { photo: string | null; onPhotoChange: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const compressed = await compressImage(file, 800, 0.7);
    onPhotoChange(URL.createObjectURL(compressed));
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf5ed]"><Camera className="h-4 w-4 text-[#5a9a7a]" /></div>
        <h3 className="text-base font-semibold text-neutral-900">Fotografía del Inversionista</h3>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        className="group relative mx-auto flex aspect-square w-full max-w-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#c2dfcb] bg-[#eaf5ed]/40 transition hover:border-[#7fb89a] hover:bg-[#eaf5ed]"
      >
        {photo ? (
          <img src={photo} alt="Inversionista" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm"><Image className="h-6 w-6 text-[#5a9a7a]" /></div>
            <p className="text-sm font-medium text-neutral-700">Arrastra una foto aquí</p>
            <p className="text-xs text-neutral-500">o haz click para subir</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 h-10 rounded-xl border border-[#c2dfcb] bg-white text-sm font-semibold text-[#5a9a7a] hover:bg-[#eaf5ed]"
        >
          <Upload className="mr-2 inline h-4 w-4" />
          {photo ? 'Cambiar' : 'Subir foto'}
        </button>
        {photo && (
          <button type="button" onClick={() => onPhotoChange(null)} className="h-10 rounded-xl border border-rose-100 bg-white px-4 text-rose-500 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-neutral-500">Formatos aceptados: JPG, PNG · Tamaño máximo 5 MB.</p>
    </div>
  );
}

export default function AddInvestorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', cedula: '', birthDate: '', nationality: '', type: 'individual',
    phone: '', phone2: '', email: '',
    capital: '', rate: '', frequency: 'mensual',
    startDate: '', term: '12m', bank: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async (andNew: boolean) => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    try {
      await createInvestor({
        name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        phone2: form.phone2 || undefined,
        cedula: form.cedula || undefined,
        birthDate: form.birthDate || undefined,
        nationality: form.nationality || undefined,
        type: form.type,
        photo: photo || undefined,
        capital: Number(form.capital) || 0,
        monthlyPayment: 0,
        rate: Number(form.rate) || 0,
        startDate: form.startDate || undefined,
        term: form.term,
        bank: form.bank || undefined,
        notes: form.notes || undefined,
      });
      if (andNew) {
        setForm({ firstName: '', lastName: '', cedula: '', birthDate: '', nationality: '', type: 'individual', phone: '', phone2: '', email: '', capital: '', rate: '', frequency: 'mensual', startDate: '', term: '12m', bank: '', notes: '' });
        setPhoto(null);
      } else {
        router.push('/inversionistas');
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/inversionistas" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5a9a7a] hover:text-[#7fb89a]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a inversionistas
            </Link>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#7fb89a]">Captación</p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Agregar inversionista</h1>
            <p className="mt-1 text-sm text-neutral-500">Registra un nuevo inversionista en tu cartera de capital.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => router.push('/inversionistas')} className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
              <X className="h-4 w-4" />Cancelar
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="h-11 rounded-full border border-[#c2dfcb] bg-[#eaf5ed] px-5 text-sm font-semibold text-[#5a9a7a] hover:bg-[#c2dfcb]/60 disabled:opacity-50 inline-flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />Guardar y nuevo
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="h-11 rounded-full bg-[#5a9a7a] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#4a866a] disabled:opacity-50 inline-flex items-center gap-1.5">
              <Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar inversionista'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <MotionCard index={0}>
              <FormSection icon={<User className="h-5 w-5 text-[#5a9a7a]" />} title="Datos personales" description="Información de identificación del inversionista." accent="#eaf5ed">
                <Field label="Nombres" htmlFor="inv-first" required>
                  <input id="inv-first" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Juan Carlos" className={inputClass} />
                </Field>
                <Field label="Apellidos" htmlFor="inv-last" required>
                  <input id="inv-last" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Pérez Montero" className={inputClass} />
                </Field>
                <Field label="Cédula / Documento" htmlFor="inv-cedula" required>
                  <input id="inv-cedula" value={form.cedula} onChange={(e) => set('cedula', e.target.value)} placeholder="001-1234567-8" className={inputClass} />
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
                <Field label="Teléfono móvil" htmlFor="inv-phone" required>
                  <input id="inv-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (809) 555-0000" className={inputClass} />
                </Field>
                <Field label="Teléfono alternativo" htmlFor="inv-phone2">
                  <input id="inv-phone2" value={form.phone2} onChange={(e) => set('phone2', e.target.value)} placeholder="+1 (829) 555-0000" className={inputClass} />
                </Field>
                <Field label="Correo electrónico" htmlFor="inv-email" required full>
                  <input id="inv-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="inversionista@correo.com" className={inputClass} />
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

          <aside className="space-y-5">
            <MotionCard index={3}>
              <PhotoUpload photo={photo} onPhotoChange={setPhoto} />
            </MotionCard>

            <MotionCard index={4} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fef3c7]"><TrendingUp className="h-4 w-4 text-[#a16207]" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Condiciones</p>
                  <p className="text-xs text-neutral-400">Capital e inversión</p>
                </div>
              </div>
              <div className="space-y-3">
                <Field label="Capital inicial (RD$)" htmlFor="inv-capital" required hint="Monto de inicio">
                  <input id="inv-capital" type="number" value={form.capital} onChange={(e) => set('capital', e.target.value)} placeholder="500,000" className={inputClass} />
                </Field>
                <Field label="Tasa de retorno (%)" htmlFor="inv-rate" required>
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
              </div>
            </MotionCard>

            <MotionCard index={5} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9e2f5]"><Calendar className="h-4 w-4 text-[#6d28d9]" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Plazo</p>
                  <p className="text-xs text-neutral-400">Vigencia de la inversión</p>
                </div>
              </div>
              <div className="space-y-3">
                <Field label="Fecha de inicio" htmlFor="inv-start" required>
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
              </div>
            </MotionCard>

            <MotionCard index={6} className="rounded-2xl bg-[#eaf5ed] p-4 text-xs leading-relaxed text-[#5a9a7a] border border-[#c2dfcb]/60">
              Los campos marcados con <span className="font-semibold">*</span> son obligatorios.
            </MotionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
