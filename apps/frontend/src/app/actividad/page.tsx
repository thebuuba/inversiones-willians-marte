'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useClientCache } from '@/lib/use-client-cache';
import { getAudit } from '@/lib/api/dashboard';
import { toDashboardAuditRow } from '@/components/dashboard/dashboard-audit';
import { formatRelativeDate } from '@/lib/date-format';

export default function ActividadPage() {
  const { user } = useAuth();
  const { data: events, loading } = useClientCache(
    'dashboard-audit-full',
    user?.role === 'ADMIN' ? () => getAudit(100) : async () => [],
  );
  const rows = (events ?? []).map(toDashboardAuditRow);
  return (
    <main className="min-h-screen bg-page px-5 py-8 text-text-primary lg:px-8">
      <Link
        href="/inicio"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Inicio
      </Link>
      <header className="my-6">
        <h1 className="text-2xl font-bold">Actividad reciente</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Últimos movimientos registrados en el sistema.
        </p>
      </header>
      <section className="rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
        {loading && !events ? (
          <p className="text-sm text-text-secondary">Cargando actividad...</p>
        ) : rows.length ? (
          <div className="divide-y divide-border-soft">
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <strong>{row.actor}</strong> {row.action}
                  <p className="text-xs text-text-secondary">
                    {row.loanHref ? (
                      <Link className="text-primary" href={row.loanHref}>
                        {row.reference}
                      </Link>
                    ) : (
                      row.reference
                    )}
                  </p>
                </div>
                <time className="text-xs text-text-secondary" dateTime={row.createdAt}>
                  {formatRelativeDate(row.createdAt)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {user?.role === 'ADMIN'
              ? 'No hay actividad reciente.'
              : 'La actividad del sistema está disponible para administradores.'}
          </p>
        )}
      </section>
    </main>
  );
}
