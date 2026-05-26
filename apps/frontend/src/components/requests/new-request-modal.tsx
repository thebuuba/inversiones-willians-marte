'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, UserPlus, X } from 'lucide-react';

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const fieldClass =
  'h-[52px] w-full rounded-[14px] border border-[#DDEBE3] bg-white px-4 text-base font-medium text-[#173D2C] shadow-[0_3px_10px_rgba(40,92,67,0.04)] outline-none transition placeholder:text-[#8E929B] focus:border-[#285C43] focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]';

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#6F8076]">{label}</span>
      <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function NewRequestModal({ open, onClose }: NewRequestModalProps) {
  const [form, setForm] = useState({
    firstName: 'Carmen',
    lastName: 'Reyes Polanco',
    identification: '000-0000000-0',
    phone: '+1 (809) 000-0000',
    amount: 'RD$ 50,000',
    reference: 'Juan Reyes — 809 555 0000',
    description: '',
  });

  const updateField = (field: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6 backdrop-blur-[2px]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex max-h-[88vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[24px] border border-[#DDEBE3] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between bg-[#F4FAF6] px-7 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#B8DCC5] text-[#173D2C]">
                  <UserPlus className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight text-[#173D2C]">Nueva solicitud</h2>
                  <p className="mt-1 text-base text-[#7E9086]">Captura los datos del solicitante.</p>
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

            <div className="modal-scroll flex-1 overflow-y-auto px-7 py-7">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <Field label="Nombre" value={form.firstName} onChange={updateField('firstName')} />
                <Field label="Apellido" value={form.lastName} onChange={updateField('lastName')} />
                <Field label="Cédula" value={form.identification} onChange={updateField('identification')} />
                <Field label="Número de teléfono" value={form.phone} onChange={updateField('phone')} />
                <Field label="Monto solicitado" value={form.amount} onChange={updateField('amount')} />
                <div>
                  <Field label="Referente" value={form.reference} onChange={updateField('reference')} />
                  <p className="mt-2 text-sm text-[#9CB5A6]">Nombre y contacto.</p>
                </div>
              </div>

              <label className="mt-7 block">
                <span className="mb-2 block text-sm font-bold text-[#6F8076]">Descripción del préstamo</span>
                <textarea
                  className="h-[130px] w-full resize-none rounded-[14px] border border-[#DDEBE3] bg-white px-4 py-4 text-base font-medium text-[#173D2C] shadow-[0_3px_10px_rgba(40,92,67,0.04)] outline-none transition placeholder:text-[#8E929B] focus:border-[#285C43] focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]"
                  onChange={(event) => updateField('description')(event.target.value)}
                  placeholder="Describe el motivo del préstamo, ingresos, garantías..."
                  value={form.description}
                />
              </label>

              <div className="mt-7">
                <p className="mb-3 text-sm font-bold text-[#6F8076]">Fotografías</p>
                <button
                  className="flex h-[160px] w-[170px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#A9CDBB] bg-[#EEF8F1] text-[#5FA37D] transition hover:-translate-y-0.5 hover:bg-[#E7F4EC]"
                  type="button"
                >
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-sm font-bold">Añadir</span>
                </button>
                <p className="mt-4 text-sm text-[#9CB5A6]">
                  Adjunta cédula, documentos del negocio o referencias visuales.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#EDF2EF] bg-white px-7 py-5">
              <button
                className="h-12 rounded-full border border-[#DDEBE3] bg-white px-7 text-base font-bold text-[#173D2C] transition hover:bg-[#F3FAF6]"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="h-12 rounded-full bg-[#285C43] px-7 text-base font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:bg-[#1F4734]"
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
