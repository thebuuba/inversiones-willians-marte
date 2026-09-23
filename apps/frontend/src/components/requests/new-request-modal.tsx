'use client';

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, UserPlus, X } from 'lucide-react';
import type { CreateRequestDto, LoanRequestItem } from '@inversiones/shared';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateRequestDto, photos: File[]) => Promise<void>;
  request?: LoanRequestItem | null;
}

const fieldClass =
  'h-11 w-full rounded-[12px] border border-primary-border bg-card px-4 text-sm font-medium text-text-primary shadow-soft outline-none transition placeholder:text-text-muted focus:border-primary focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]';

type FormField =
  | 'firstName'
  | 'lastName'
  | 'identification'
  | 'phone'
  | 'amount'
  | 'reference'
  | 'description';

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
      <span className="mb-2 block text-sm font-bold text-text-secondary">{label}</span>
      <input
        className={fieldClass}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
});

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

export function NewRequestModal({ open, onClose, onSubmit, request }: NewRequestModalProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    firstName: request?.firstName ?? '',
    lastName: request?.lastName ?? '',
    identification: request?.identification ?? '',
    phone: request?.phone ?? '',
    amount: request?.amount == null ? '' : formatCurrencyInput(String(request.amount)),
    reference: request?.reference ?? '',
    description: request?.description ?? '',
  }));

  const updateField = useCallback((field: FormField, value: string) => {
    const sanitized =
      field === 'identification'
        ? formatCedula(value)
        : field === 'phone'
          ? formatPhone(value)
          : value;
    setForm((current) => ({ ...current, [field]: sanitized }));
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    const amount = parseCurrencyInput(form.amount);
    const empty = request ? null : undefined;
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(
        {
          firstName: form.firstName.trim() || empty,
          lastName: form.lastName.trim() || empty,
          identification: form.identification.trim() || empty,
          phone: form.phone.trim() || empty,
          amount: form.amount.trim() ? amount : empty,
          reference: form.reference.trim() || empty,
          description: form.description.trim() || empty,
        },
        photos,
      );
      setForm({
        firstName: '',
        lastName: '',
        identification: '',
        phone: '',
        amount: '',
        reference: '',
        description: '',
      });
      setPhotos([]);
    } catch {
      setError(
        `No se pudo ${request ? 'guardar' : 'crear'} la solicitud. Revisa la conexión e inténtalo de nuevo.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-request-title"
            className="flex max-h-[84vh] w-full max-w-[700px] flex-col overflow-hidden rounded-panel border border-primary-border bg-card shadow-modal"
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
                  <h2
                    id="new-request-title"
                    className="text-lg font-bold leading-tight text-text-primary"
                  >
                    {request ? 'Editar solicitud' : 'Nueva solicitud'}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {request
                      ? `Actualiza los datos de ${request.code}.`
                      : 'Captura los datos del solicitante.'}
                  </p>
                </div>
              </div>
              <button
                aria-label="Cerrar"
                className="rounded-full p-2 text-text-secondary transition hover:bg-card hover:text-text-primary"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-scroll flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                <Field
                  label="Nombre"
                  name="firstName"
                  value={form.firstName}
                  onChange={updateField}
                />
                <Field
                  label="Apellido"
                  name="lastName"
                  value={form.lastName}
                  onChange={updateField}
                />
                <Field
                  label="Cédula"
                  maxLength={13}
                  name="identification"
                  value={form.identification}
                  onChange={updateField}
                />
                <Field
                  label="Número de teléfono"
                  maxLength={14}
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-text-secondary">
                    Monto solicitado
                  </span>
                  <div className="flex h-11 items-center rounded-[12px] border border-primary-border bg-card shadow-soft transition has-[input:focus]:border-primary has-[input:focus]:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]">
                    <span className="pl-4 text-sm font-bold text-primary-accent">RD$</span>
                    <input
                      className="h-full flex-1 bg-transparent px-2 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                      placeholder="0"
                      value={form.amount}
                      onChange={(event) =>
                        updateField('amount', formatCurrencyInput(event.target.value))
                      }
                    />
                  </div>
                </label>
                <div>
                  <Field
                    label="Referente"
                    name="reference"
                    value={form.reference}
                    onChange={updateField}
                  />
                  <p className="mt-2 text-sm text-text-muted">Nombre y contacto.</p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-bold text-text-secondary">
                  Descripción del préstamo
                </span>
                <textarea
                  className="h-[104px] w-full resize-none rounded-[12px] border border-primary-border bg-card px-4 py-3 text-sm font-medium text-text-primary shadow-soft outline-none transition placeholder:text-text-muted focus:border-primary focus:shadow-[0_0_0_3px_rgba(95,163,125,0.12)]"
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe el motivo del préstamo, ingresos, garantías..."
                  value={form.description}
                />
              </label>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-text-secondary">Fotografías</p>
                <label
                  className="flex h-[128px] w-[142px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[16px] border border-dashed border-text-secondary bg-[#EEF8F1] text-primary-accent transition hover:-translate-y-0.5 hover:bg-primary-soft"
                  htmlFor="request-photos"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm font-bold">Añadir</span>
                </label>
                <input
                  id="request-photos"
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
                      setError('Cada foto debe pesar menos de 10 MB.');
                    } else {
                      setPhotos((current) => [...current, ...files]);
                      setError('');
                    }
                    event.target.value = '';
                  }}
                />
                {photos.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                    {photos.map((photo, index) => (
                      <li key={`${photo.name}-${index}`} className="flex items-center gap-2">
                        <span className="truncate">{photo.name}</span>
                        <button
                          type="button"
                          aria-label={`Quitar ${photo.name}`}
                          onClick={() =>
                            setPhotos((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-sm text-text-muted">
                  Adjunta cédula, documentos del negocio o referencias visuales.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border-soft bg-card px-6 py-4 shadow-soft">
              {error && (
                <p role="alert" className="mr-auto self-center text-sm text-state-danger">
                  {error}
                </p>
              )}
              <button
                className="h-11 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary transition hover:bg-surface-muted-ui"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-action transition hover:bg-primary-hover"
                onClick={handleSubmit}
                disabled={submitting}
                type="button"
              >
                {submitting ? 'Guardando...' : request ? 'Guardar cambios' : 'Crear solicitud'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
