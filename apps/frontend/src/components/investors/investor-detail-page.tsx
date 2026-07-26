'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getInvestor } from '@/lib/api/investors';
import { getDocuments, createDocument, downloadDocument } from '@/lib/api/documents';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';
import { formatDop } from '@/lib/currency';
import type { InvestorItem, DocumentItem } from '@inversiones/shared';
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  Download,
  Eye,
  File,
  Plus,
  TrendingUp,
  Phone,
  Mail,
  Upload,
} from 'lucide-react';

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const paymentStatusLabel = {
  PAID: 'Al dia',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasada',
} as const;

const TABS = ['Resumen', 'Historial de pagos', 'Documentos', 'Datos personales'];

export function InvestorDetailPage({ investorId }: { investorId: string }) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<InvestorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([
      getInvestor(investorId),
      getDocuments(undefined, investorId).catch(() => [] as DocumentItem[]),
    ])
      .then(([investor, docs]) => {
        if (!cancelled) {
          setData(investor);
          setDocuments(docs);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [investorId]);

  const capital = data?.capital ?? 0;
  const rate = data?.rate ?? 0;
  const monthlyReturn = data?.monthlyPayment ?? 0;
  const investments = data?.investments ?? [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Inversionista no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-primary-accent underline" href="/inversionistas">
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Capital invertido',
      value: fmt(capital),
      icon: Banknote,
      iconClass: 'bg-state-success-bg text-state-success',
    },
    {
      label: 'Total pagado',
      value: fmt(0),
      icon: CircleCheck,
      iconClass: 'bg-state-success-bg text-state-success',
    },
    {
      label: 'Tasa de retorno',
      value: `${rate}% mensual`,
      icon: TrendingUp,
      iconClass: 'bg-state-warning-bg text-state-warning',
    },
  ];

  const conditions = [
    { label: 'Capital', value: fmt(capital) },
    { label: 'Tasa mensual', value: `${rate}%` },
    { label: 'Retorno mensual', value: fmt(monthlyReturn) },
    { label: 'Frecuencia', value: 'Mensual' },
    { label: 'Banco', value: data.bank ?? '—' },
    { label: 'Inicio', value: data.startDate ? fmtDate(data.startDate) : '—' },
    { label: 'Plazo', value: data.term ?? '—' },
  ];

  const personalFields = [
    { label: 'Nombres', value: data.name },
    { label: 'Cédula', value: data.cedula ?? '—' },
    { label: 'Fecha de nacimiento', value: data.birthDate ? fmtDate(data.birthDate) : '—' },
    { label: 'Nacionalidad', value: data.nationality ?? '—' },
    { label: 'Tipo', value: data.type ?? '—' },
    { label: 'Teléfono', value: data.phone ?? '—' },
    { label: 'Tel. alternativo', value: data.phone2 ?? '—' },
    { label: 'Correo', value: data.email ?? '—' },
    { label: 'Banco', value: data.bank ?? '—' },
  ];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      await appendDocumentUploadFiles(fd, file);
      fd.append('name', file.name);
      fd.append('category', 'general');
      fd.append('investorId', investorId);
      await createDocument(fd);
      const docs = await getDocuments(undefined, investorId);
      setDocuments(docs ?? []);
    } catch {
      /* silent */
    }
  }

  return (
    <div className="min-h-screen bg-page font-sans">
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-accent hover:text-primary-accent"
          href="/inversionistas"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a inversionistas
        </Link>

        <div className="mb-6 overflow-hidden rounded-panel bg-card shadow-card border border-border-soft">
          <div className="px-8 pt-6 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5">
                {data.photo ? (
                  <div
                    aria-label={data.name}
                    className="h-20 w-20 shrink-0 rounded-panel border-4 border-card bg-cover bg-center shadow-card"
                    role="img"
                    style={{ backgroundImage: `url(${data.photo})` }}
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-panel border-4 border-card bg-primary-soft shadow-card">
                    <TrendingUp className="h-8 w-8 text-primary-accent" />
                  </div>
                )}
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-text-primary">{data.name}</h1>
                    <span className="rounded-full bg-primary-soft px-3 py-0.5 text-xs font-semibold text-primary-accent">
                      ✦{' '}
                      {data.status === 'ACTIVE'
                        ? 'Activo'
                        : data.status === 'PAUSED'
                          ? 'Pausado'
                          : 'Retirado'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {data.code} · {data.cedula ?? '—'} · {data.type}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                    {data.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {data.phone}
                      </span>
                    )}
                    {data.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {data.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <button className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary-border bg-card px-5 text-sm text-text-secondary hover:bg-surface-subtle">
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                <Link
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary-accent bg-card px-5 text-sm text-primary-accent hover:bg-primary-soft"
                  href={`/inversionistas/nuevo?sourceInvestorId=${investorId}`}
                >
                  <Plus className="h-4 w-4" />
                  Nueva inversión
                </Link>
                {investments.length === 1 && (
                  <Link
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm text-white hover:bg-primary"
                    href={`/inversionistas/pago?investmentId=${investments[0].id}`}
                  >
                    <Plus className="h-4 w-4" />
                    Registrar pago
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsCards.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-panel bg-card p-5 shadow-card border border-border-soft"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted">{k.label}</p>
                    <p className="mt-0.5 text-base font-bold text-text-primary">{k.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5 flex w-fit gap-1 rounded-panel bg-card p-1.5 shadow-card border border-border-soft">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`rounded-control-comfortable px-5 py-2 text-sm font-semibold transition ${
                tab === i
                  ? 'bg-primary-accent text-white shadow-card'
                  : 'text-text-muted hover:bg-primary-soft hover:text-primary-accent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-text-primary">Inversiones</h3>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-accent">
                    {investments.length} activas/historicas
                  </span>
                </div>
                {investments.length === 0 ? (
                  <p className="rounded-control-comfortable border border-border-soft bg-surface-subtle p-5 text-sm text-text-subtle">
                    Este inversionista aun no tiene inversiones registradas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {investments.map((investment) => {
                      const status = investment.paymentStatus
                        ? paymentStatusLabel[investment.paymentStatus]
                        : 'Pendiente';
                      return (
                        <div
                          key={investment.id}
                          className="rounded-control-comfortable border border-border-soft bg-surface-subtle p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-text-primary">
                                  {investment.code}
                                </p>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${investment.paymentStatus === 'OVERDUE' ? 'bg-state-danger-bg text-state-danger' : investment.paymentStatus === 'PAID' ? 'bg-primary-soft text-primary-accent' : 'bg-state-warning-bg text-state-warning'}`}
                                >
                                  {status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-text-subtle">
                                Inicio {investment.startDate ? fmtDate(investment.startDate) : '—'}{' '}
                                · Plazo {investment.term ?? 'Indefinido'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                className="rounded-full border border-primary-border bg-card px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-subtle"
                                href={`/inversiones/${investment.id}`}
                              >
                                Ver detalle
                              </Link>
                              <Link
                                className="rounded-full bg-primary-accent px-3 py-2 text-xs font-semibold text-white hover:bg-primary"
                                href={`/inversionistas/pago?investmentId=${investment.id}`}
                              >
                                Registrar pago
                              </Link>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div>
                              <p className="text-xs text-text-subtle">Capital</p>
                              <p className="font-semibold text-text-primary">
                                {fmt(investment.capital)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-text-subtle">Tasa</p>
                              <p className="font-semibold text-text-primary">
                                {investment.rate}% mensual
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-text-subtle">Retorno mensual</p>
                              <p className="font-semibold text-text-primary">
                                {fmt(investment.monthlyPayment)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-text-subtle">Proximo vencimiento</p>
                              <p className="font-semibold text-text-primary">
                                {investment.nextDueDate ? fmtDate(investment.nextDueDate) : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">
                  Condiciones pactadas
                </h3>
                <div className="space-y-3">
                  {conditions.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between border-b border-border-soft pb-2 last:border-0 gap-3"
                    >
                      <span className="text-xs text-text-muted shrink-0">{r.label}</span>
                      <span className="text-sm font-semibold text-text-primary text-right">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {data.notes && (
                <div className="rounded-panel bg-primary-soft p-5 border border-border-soft">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-accent">
                    Notas
                  </p>
                  <p className="text-sm text-text-secondary">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="overflow-hidden rounded-panel bg-card shadow-card border border-border-soft">
            <div className="grid grid-cols-12 gap-4 border-b border-border-soft bg-surface-subtle px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Período</div>
              <div className="col-span-2">Vencimiento</div>
              <div className="col-span-2">Fecha pago</div>
              <div className="col-span-2">Monto</div>
              <div className="col-span-1">Método</div>
              <div className="col-span-2 text-right">Estado / Acción</div>
            </div>
            <div className="py-12 text-center text-sm text-text-subtle">
              No hay pagos registrados aún.
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm text-white hover:bg-primary">
                <Upload className="h-4 w-4" />
                Subir documento
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="py-12 text-center text-sm text-text-subtle">Sin documentos adjuntos.</p>
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-panel bg-card px-6 py-4 shadow-card border border-border-soft hover:bg-primary-soft/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-control-comfortable bg-primary-soft">
                      <File className="h-5 w-5 text-primary-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{d.name}</p>
                      <p className="text-xs text-text-muted">
                        {d.category} · Subido {fmtDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  {d.fileUrl && (
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-text-muted hover:bg-primary-soft hover:text-primary-accent"
                      onClick={() => downloadDocument(d.id, d.name)}
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {personalFields.map((r) => (
              <div
                key={r.label}
                className="rounded-panel bg-card px-6 py-4 shadow-card border border-border-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  {r.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
