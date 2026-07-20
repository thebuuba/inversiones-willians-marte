'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { getLoan, updateLoan, type LoanDetail } from '@/lib/api/loans';
import { formatDop } from '@/lib/currency';
import { LoanStatusEnum } from '@inversiones/shared';

const fmt = (n: number | string) => formatDop(n, { decimals: 2, space: true });

const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'RESTRUCTURED', label: 'Reestructurado' },
  { value: 'WRITTEN_OFF', label: 'Castigado' },
];

export function EditLoanPage({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [interestRate, setInterestRate] = useState('');

  useEffect(() => {
    getLoan(loanId)
      .then((data) => {
        setLoan(data);
        setNotes(data.notes ?? '');
        setStatus(data.status);
        setInterestRate(String(Number(data.interestRate)));
      })
      .catch(() => setError('No se pudo cargar el préstamo.'))
      .finally(() => setLoading(false));
  }, [loanId]);

  const handleSave = async () => {
    if (!loan) return;
    setSaving(true);
    setError(null);
    try {
      await updateLoan(loanId, {
        notes: notes.trim() || undefined,
        status: status as keyof typeof LoanStatusEnum,
        interestRate: interestRate ? Number(interestRate) : undefined,
      });
      router.push(`/prestamos/${loanId}`);
    } catch {
      setError('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page text-sm font-medium text-text-muted">
        Cargando préstamo...
      </main>
    );
  }

  if (!loan) {
    return (
      <main className="min-h-screen bg-page p-5">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error ?? 'Préstamo no encontrado.'}</p>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary-accent" href="/prestamos">
            Volver a préstamos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-accent hover:text-primary-accent"
          href={`/prestamos/${loanId}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al préstamo
        </Link>

        <div className="rounded-3xl bg-white shadow-sm border border-border-soft">
          <div className="border-b border-border-soft px-8 py-6">
            <h1 className="text-xl font-bold text-text-primary">Editar préstamo</h1>
            <p className="mt-1 text-sm text-text-subtle">
              #{loan.loanNumber} — {loan.client.firstName} {loan.client.lastName}
            </p>
          </div>

          <div className="space-y-6 px-8 py-6">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-subtle px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Capital</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{fmt(loan.principal)}</p>
              </div>
              <div className="rounded-xl bg-surface-subtle px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Balance</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{fmt(loan.balance)}</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none rounded-xl border border-primary-border bg-white px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
                Tasa de interés (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full rounded-xl border border-primary-border bg-white px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
              />
              <p className="mt-1 text-xs text-text-subtle">
                La tasa actual es {Number(loan.interestRate)}%. Cambiarla no recalcula el calendario de pagos existente.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Notas</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas del préstamo..."
                className="w-full resize-none rounded-xl border border-primary-border bg-white px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-soft px-8 py-5">
            <Link
              className="inline-flex h-10 items-center rounded-full border border-primary-border bg-white px-5 text-sm font-semibold text-text-secondary hover:bg-surface-subtle"
              href={`/prestamos/${loanId}`}
            >
              Cancelar
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
