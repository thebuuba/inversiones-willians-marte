'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, MessageCircle, PhoneCall, Plus, X } from 'lucide-react';
import type {
  CollectionChannel,
  CollectionResult,
  CreateCollectionInteractionDto,
} from '@inversiones/shared';
import {
  createCollectionInteraction,
  getLoanCollectionInteractions,
  type CollectionInteractionItem,
} from '@/lib/api/collection-interactions';
import { formatDop } from '@/lib/currency';
import { DatePickerInput } from '@/components/ui/date-picker-input';

const channels: Array<{ value: CollectionChannel; label: string }> = [
  { value: 'CALL', label: 'Llamada' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Correo' },
  { value: 'OTHER', label: 'Otro' },
];

const results: Array<{ value: CollectionResult; label: string }> = [
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'NO_ANSWER', label: 'No respondió' },
  { value: 'WRONG_NUMBER', label: 'Número incorrecto' },
  { value: 'PAYMENT_PROMISE', label: 'Promesa de pago' },
  { value: 'EXTENSION_REQUEST', label: 'Solicita prórroga' },
  { value: 'DISPUTE', label: 'Disputa el monto' },
  { value: 'REFUSED', label: 'Se niega a pagar' },
  { value: 'OTHER', label: 'Otro resultado' },
];

const promiseLabels = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  FULFILLED: 'Cumplida',
  BROKEN: 'Incumplida',
  CANCELLED: 'Cancelada',
} as const;

const promiseTones = {
  PENDING: 'bg-amber-50 text-amber-700',
  PARTIAL: 'bg-blue-50 text-blue-700',
  FULFILLED: 'bg-emerald-50 text-emerald-700',
  BROKEN: 'bg-state-danger-bg text-state-danger',
  CANCELLED: 'bg-state-neutral-bg text-text-secondary',
} as const;

const today = () => {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
const fmtCalendarDate = (value: string) => fmtDate(`${value.slice(0, 10)}T12:00:00`);

function labelFor<T extends string>(items: Array<{ value: T; label: string }>, value: T) {
  return items.find((item) => item.value === value)?.label ?? value;
}

export function InteractionModal({
  initialResult,
  loanId,
  onClose,
  onSaved,
}: {
  initialResult?: CollectionResult;
  loanId: string;
  onClose: () => void;
  onSaved: (interaction: CollectionInteractionItem) => void;
}) {
  const [channel, setChannel] = useState<CollectionChannel>('CALL');
  const [result, setResult] = useState<CollectionResult>(initialResult ?? 'CONTACTED');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('09:00');
  const [promiseAmount, setPromiseAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      setError('Escribe la información proporcionada por el cliente.');
      return;
    }

    const dto: CreateCollectionInteractionDto = {
      loanId,
      channel,
      result,
      notes: trimmedNotes,
      nextFollowUpDate: followUpDate || undefined,
      nextFollowUpTime: followUpDate ? followUpTime : undefined,
    };

    if (result === 'PAYMENT_PROMISE') {
      const amount = Number(promiseAmount);
      if (!Number.isFinite(amount) || amount <= 0 || !promiseDate) {
        setError('Indica el monto y la fecha de la promesa.');
        return;
      }
      dto.promiseAmount = amount;
      dto.promiseDate = promiseDate;
    }

    setSaving(true);
    setError('');
    try {
      onSaved(await createCollectionInteraction(dto));
      onClose();
    } catch {
      setError('No se pudo registrar la gestión. Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-panel border border-border-soft bg-card shadow-modal">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-soft bg-card px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Registrar gestión de cobro</h2>
            <p className="mt-1 text-sm text-text-secondary">
              La gestión quedará en el historial del préstamo.
            </p>
          </div>
          <button
            className="rounded-full p-2 text-text-subtle hover:bg-state-neutral-bg"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Canal
              </span>
              <select
                className="h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-3 text-sm font-semibold text-text-primary"
                onChange={(event) => setChannel(event.target.value as CollectionChannel)}
                value={channel}
              >
                {channels.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Resultado
              </span>
              <select
                className="h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-3 text-sm font-semibold text-text-primary"
                onChange={(event) => setResult(event.target.value as CollectionResult)}
                value={result}
              >
                {results.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-secondary">
              Información proporcionada
            </span>
            <textarea
              autoFocus
              className="min-h-28 w-full resize-y rounded-control-comfortable border border-primary-border px-4 py-3 text-sm text-text-primary outline-none focus:border-primary-accent"
              maxLength={2000}
              onChange={(event) => {
                setNotes(event.target.value);
                setError('');
              }}
              placeholder="Ej: Indicó que recibió el pago tarde y realizará el depósito el viernes..."
              value={notes}
            />
          </label>

          {result === 'PAYMENT_PROMISE' ? (
            <div className="grid gap-4 rounded-panel border border-state-warning-bg bg-state-warning-bg p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-state-warning">
                  Monto prometido
                </span>
                <input
                  className="h-11 w-full rounded-control-comfortable border border-state-warning-bg bg-card px-3 text-sm font-bold text-text-primary"
                  inputMode="decimal"
                  onChange={(event) => setPromiseAmount(event.target.value)}
                  placeholder="0.00"
                  value={promiseAmount}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-state-warning">
                  Fecha prometida
                </span>
                <DatePickerInput
                  className="h-11 w-full rounded-control-comfortable border border-state-warning-bg bg-card px-3 text-sm font-bold text-text-primary"
                  onChange={setPromiseDate}
                  value={promiseDate}
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Próximo seguimiento
              </span>
              <DatePickerInput
                className="h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-3 text-sm font-semibold text-text-primary"
                onChange={setFollowUpDate}
                value={followUpDate}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Hora
              </span>
              <input
                className="h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-3 text-sm font-semibold text-text-primary disabled:bg-surface-subtle"
                disabled={!followUpDate}
                onChange={(event) => setFollowUpTime(event.target.value)}
                type="time"
                value={followUpTime}
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-control-comfortable bg-state-danger-bg px-4 py-3 text-sm font-semibold text-state-danger">
              {error}
            </p>
          ) : null}
          <button
            className="h-11 w-full rounded-full bg-primary-accent text-sm font-bold text-white transition hover:bg-primary disabled:opacity-60"
            disabled={saving}
            onClick={handleSubmit}
            type="button"
          >
            {saving ? 'Guardando...' : 'Guardar gestión'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function CollectionManagementPanel({
  agreementOpen = false,
  loanId,
  onAgreementClose,
  phone,
  altPhone,
}: {
  agreementOpen?: boolean;
  loanId: string;
  onAgreementClose?: () => void;
  phone?: string | null;
  altPhone?: string | null;
}) {
  const [items, setItems] = useState<CollectionInteractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [initialResult, setInitialResult] = useState<CollectionResult>('CONTACTED');

  useEffect(() => {
    let active = true;
    getLoanCollectionInteractions(loanId)
      .then((interactions) => {
        if (!active) return;
        setItems(interactions);
        setError('');
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el historial de cobranza.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loanId]);

  return (
    <section className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
      <header className="flex flex-col justify-between gap-4 border-b border-border-soft px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <PhoneCall className="h-5 w-5 text-primary-accent" /> Gestiones de cobro
          </h2>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            Llamadas, acuerdos y próximos seguimientos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {phone ? (
            <a
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-border px-4 text-sm font-bold text-primary-accent hover:bg-surface-muted-ui"
              href={`tel:${phone}`}
            >
              <PhoneCall className="h-4 w-4" /> {phone}
            </a>
          ) : null}
          {phone ? (
            <a
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-border px-4 text-sm font-bold text-primary-accent hover:bg-surface-muted-ui"
              href={`https://wa.me/${phone.replace(/\D/g, '')}`}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          ) : null}
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-accent px-4 text-sm font-bold text-white hover:bg-primary"
            onClick={() => {
              setInitialResult('CONTACTED');
              setModalOpen(true);
            }}
            type="button"
          >
            <Plus className="h-4 w-4" /> Registrar gestión
          </button>
        </div>
      </header>

      {altPhone ? (
        <p className="border-b border-border-soft px-5 py-2 text-xs font-semibold text-text-secondary">
          Teléfono alternativo:{' '}
          <a className="text-primary-accent" href={`tel:${altPhone}`}>
            {altPhone}
          </a>
        </p>
      ) : null}
      {error ? (
        <p className="m-5 rounded-control-comfortable bg-state-danger-bg px-4 py-3 text-sm font-semibold text-state-danger">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-text-secondary">Cargando historial...</p>
      ) : null}
      {!loading && items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-secondary">
          Todavía no se han registrado gestiones para este préstamo.
        </p>
      ) : null}

      <div className="divide-y divide-border-soft">
        {items.map((item) => (
          <article className="px-5 py-4" key={item.id}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
                    {labelFor(channels, item.channel)}
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {labelFor(results, item.result)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                  {item.notes}
                </p>
              </div>
              <p className="shrink-0 text-xs font-semibold text-text-muted">
                {item.createdBy.name} · {fmtDate(item.createdAt)}
              </p>
            </div>

            {item.promise ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control-comfortable border border-state-warning-bg bg-state-warning-bg/50 px-4 py-3 text-sm">
                <span className="font-bold text-text-primary">
                  Promesa: {formatDop(item.promise.amount, { decimals: 2, space: true })}
                </span>
                <span className="font-semibold text-text-secondary">
                  Para {fmtCalendarDate(item.promise.dueDate)}
                </span>
                {Number(item.promise.fulfilledAmount) > 0 ? (
                  <span className="font-semibold text-text-secondary">
                    Aplicado:{' '}
                    {formatDop(item.promise.fulfilledAmount, { decimals: 2, space: true })}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${promiseTones[item.promise.status]}`}
                >
                  {promiseLabels[item.promise.status]}
                </span>
              </div>
            ) : null}

            {item.nextFollowUpDate ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-accent">
                <CalendarClock className="h-4 w-4" /> Seguimiento:{' '}
                {fmtCalendarDate(item.nextFollowUpDate)}{' '}
                {item.nextFollowUpTime ? `a las ${item.nextFollowUpTime}` : ''}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {modalOpen || agreementOpen ? (
        <InteractionModal
          initialResult={agreementOpen ? 'PAYMENT_PROMISE' : initialResult}
          key={`${loanId}-${agreementOpen ? 'PAYMENT_PROMISE' : initialResult}`}
          loanId={loanId}
          onClose={() => {
            setModalOpen(false);
            onAgreementClose?.();
          }}
          onSaved={(interaction) => setItems((current) => [interaction, ...current])}
        />
      ) : null}
    </section>
  );
}
