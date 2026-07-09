'use client';

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, UserPlus, X } from 'lucide-react';
import type { CreateRequestDto } from '@inversiones/shared';

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateRequestDto) => void;
}

const fieldClass =
  'h-11 w-full rounded-[12px] border border-[#DDEBE3] bg-white px-4 text-sm font-medium text-[#173D2C] shadow-[0_3px_10px_rgba(40,92,67,0.04)] outline-none transition placeholder:text-[#8E929B] focus:border-[#285C43] focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]';

type FormField = 'firstName' | 'lastName' | 'identification' | 'phone' | 'amount' | 'reference' | 'description';

const Field = memo(function Field({
  label,
  name,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  name: FormField;
  value: string;
  onChange: (field: FormField, value: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#5C6D63]">{label}</span>
      <input className={fieldClass} maxLength={maxLength} value={value} onChange={(event) => onChange(name, event.target.value)} />
    </label>
  );
});

function formatCurrency(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const parts = cleaned.split('.');
  const integer = parts[0].replace(/^0+/, '') || '0';
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${formatted}.${parts.slice(1).join('')}` : formatted;
}

function formatCedula(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/[^0-9.]/g, '')) || 0;
}

export function NewRequestModal({ open, onClose, onSubmit }: NewRequestModalProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    identification: '',
    phone: '',
    amount: '',
    reference: '',
    description: '',
  });

  const updateField = useCallback((field: FormField, value: string) => {
    const sanitized = field === 'identification' ? formatCedula(value) : field === 'phone' ? formatPhone(value) : value;
    setForm((current) => ({ ...current, [field]: sanitized }));
  }, []);

  const handleSubmit = () => {
    const amount = parseAmount(form.amount);
    if (!form.firstName.trim() || !form.lastName.trim() || amount <= 0) return;

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identification: form.identification.trim() || undefined,
      phone: form.phone.trim() || undefined,
      amount,
      reference: form.reference.trim() || undefined,
      description: form.description.trim() || undefined,
    });

    setForm({ firstName: '', lastName: '', identification: '', phone: '', amount: '', reference: '', description: '' });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-[84vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[22px] border border-[#DDEBE3] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between bg-[#F4FAF6] px-6 py-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-accent)]">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight text-[#173D2C]">Nueva solicitud</h2>
                  <p className="mt-1 text-sm text-[#5C6D63]">Captura los datos del solicitante.</p>
                </div>
              </div>
              <button
                aria-label="Cerrar"
                className="rounded-full p-2 text-[#4B5750] transition hover:bg-white hover:text-[#173D2C]"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-scroll flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                <Field label="Nombre" name="firstName" value={form.firstName} onChange={updateField} />
                <Field label="Apellido" name="lastName" value={form.lastName} onChange={updateField} />
                <Field label="Cédula" maxLength={13} name="identification" value={form.identification} onChange={updateField} />
                <Field label="Número de teléfono" maxLength={14} name="phone" value={form.phone} onChange={updateField} />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#5C6D63]">Monto solicitado</span>
                  <div className="flex h-11 items-center rounded-[12px] border border-[#DDEBE3] bg-white shadow-[0_3px_10px_rgba(40,92,67,0.04)] transition has-[input:focus]:border-[#285C43] has-[input:focus]:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]">
                    <span className="pl-4 text-sm font-bold text-[#2F7654]">RD$</span>
                    <input
                      className="h-full flex-1 bg-transparent px-2 text-sm font-medium text-[#173D2C] outline-none placeholder:text-[#8E929B]"
                      placeholder="0"
                      value={form.amount}
                      onChange={(event) => updateField('amount', formatCurrency(event.target.value))}
                    />
                  </div>
                </label>
                <div>
                  <Field label="Referente" name="reference" value={form.reference} onChange={updateField} />
                  <p className="mt-2 text-sm text-[#9CB5A6]">Nombre y contacto.</p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-bold text-[#5C6D63]">Descripción del préstamo</span>
                <textarea
                  className="h-[104px] w-full resize-none rounded-[12px] border border-[#DDEBE3] bg-white px-4 py-3 text-sm font-medium text-[#173D2C] shadow-[0_3px_10px_rgba(40,92,67,0.04)] outline-none transition placeholder:text-[#8E929B] focus:border-[#285C43] focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]"
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe el motivo del préstamo, ingresos, garantías..."
                  value={form.description}
                />
              </label>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-[#5C6D63]">Fotografías</p>
                <button
                  className="flex h-[128px] w-[142px] flex-col items-center justify-center gap-2.5 rounded-[16px] border border-dashed border-[#5C6D63] bg-[#EEF8F1] text-[#2F7654] transition hover:-translate-y-0.5 hover:bg-[#E7F4EC]"
                  type="button"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm font-bold">Añadir</span>
                </button>
                <p className="mt-4 text-sm text-[#9CB5A6]">
                  Adjunta cédula, documentos del negocio o referencias visuales.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--border-soft)] bg-white px-6 py-4 shadow-[0_-10px_24px_rgba(40,92,67,0.04)]">
              <button
                className="h-11 rounded-full border border-[#DDEBE3] bg-white px-6 text-sm font-bold text-[#173D2C] transition hover:bg-[#F3FAF6]"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="h-11 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:bg-[#1F4734]"
                onClick={handleSubmit}
                type="button"
              >
                Crear solicitud
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
