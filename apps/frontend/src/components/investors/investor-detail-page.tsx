'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getInvestor } from '@/lib/api/investors';
import { getDocuments, createDocument, downloadDocument } from '@/lib/api/documents';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';
import { formatDop } from '@/lib/currency';
import { getInvestorOverview } from './investors-panel.helpers';
import { InvestorPaymentDialog } from './investor-payment-dialog';
import { Card } from '@/components/ui/card';
import { pageEntryHeaderClassName, pageEntryStatCardClassName } from '@/lib/page-entry-animation';
import { investmentPaymentStatusVisuals } from '@/lib/investment-payment-status';
import type { InvestorItem, DocumentItem } from '@inversiones/shared';
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
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

const fmt = (n: number | string) => formatDop(n, { space: true, decimals: 2 });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
const investmentTableColumns = 'grid-cols-6 gap-6';

const TABS = ['Resumen', 'Documentos', 'Datos personales'];

export function InvestorDetailPage({ investorId }: { investorId: string }) {
  const [tab, setTab] = useState(0);
  const [paymentInvestmentId, setPaymentInvestmentId] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      getDocuments(undefined, investorId).catch(() => {
        if (!cancelled) setDocumentError('No se pudieron cargar los documentos.');
        return [] as DocumentItem[];
      }),
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
  const rate = data ? getInvestorOverview([data]).rate : 0;
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
        <Link
          className="mt-4 text-sm font-bold text-primary-accent underline"
          href="/inversionistas"
        >
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const activeInvestmentCount = investments.filter(
    (investment) => investment.status === 'ACTIVE',
  ).length;
  const pendingInvestments = investments.filter(
    (investment) => investment.status === 'ACTIVE' && (investment.pendingAmount ?? 0) > 0,
  );
  const pendingTotal = pendingInvestments.reduce(
    (sum, investment) => sum + (investment.pendingAmount ?? 0),
    0,
  );
  const pendingMonths = pendingInvestments.reduce(
    (sum, investment) => sum + (investment.pendingMonths ?? 0),
    0,
  );

  const statsCards = [
    {
      label: 'Capital invertido',
      value: fmt(capital),
      detail: `${activeInvestmentCount} ${activeInvestmentCount === 1 ? 'inversión activa' : 'inversiones activas'}`,
      icon: Banknote,
      iconClass: 'bg-primary-soft text-primary',
    },
    {
      label: 'Ganancias pagadas',
      value: data.totalGainsPaid === undefined ? '—' : fmt(data.totalGainsPaid),
      detail: 'Total recibido por el inversionista',
      icon: CircleCheck,
      iconClass: 'bg-state-success-bg text-state-success',
    },
    {
      label: 'Tasa de retorno',
      value: `${rate.toLocaleString('es-DO', { maximumFractionDigits: 2 })}% mensual`,
      detail: 'Interés mensual simple',
      icon: TrendingUp,
      iconClass: 'bg-state-warning-bg text-state-warning',
    },
    {
      label: 'Interés pendiente',
      value: fmt(pendingTotal),
      detail:
        pendingMonths > 0
          ? `${pendingMonths} ${pendingMonths === 1 ? 'mensualidad' : 'mensualidades'} por pagar`
          : 'Sin intereses vencidos',
      icon: Banknote,
      iconClass: 'bg-state-warning-bg text-state-warning',
    },
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

  function exportStatement() {
    const rows = [
      ['Inversión', 'Capital', 'Interés mensual', 'Pagado', 'Pendiente', 'Próximo vencimiento'],
      ...investments.map((investment) => [
        investment.code,
        investment.capital,
        investment.monthlyPayment,
        investment.totalPaid ?? 0,
        investment.pendingAmount ?? 0,
        investment.nextDueDate ? fmtDate(investment.nextDueDate) : '',
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${(/^[=+@-]/.test(String(value)) ? "'" : '') + String(value).replaceAll('"', '""')}"`,
          )
          .join(','),
      )
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estado_${data?.code ?? 'inversionista'}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setDocumentError(null);
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
      setDocumentError('No se pudo subir el documento. Intenta de nuevo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-page font-sans">
      <div className="w-full p-4 md:p-5">
        <Link
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-accent hover:text-primary-accent"
          href="/inversionistas"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a inversionistas
        </Link>

        <div
          className={`${pageEntryHeaderClassName} mb-6 overflow-hidden rounded-2xl bg-card shadow-card`}
        >
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {data.photo ? (
                  <div
                    aria-label={data.name}
                    className="h-16 w-16 shrink-0 rounded-2xl border-4 border-card bg-cover bg-center shadow-card"
                    role="img"
                    style={{ backgroundImage: 'url(' + data.photo + ')' }}
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary-soft shadow-card">
                    <TrendingUp className="h-8 w-8 text-primary-accent" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-[29px] font-bold leading-tight text-text-primary">
                    {data.name}
                  </h1>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {data.code} · {data.cedula ?? '—'}
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
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-card shadow-card px-5 text-sm font-semibold text-text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2"
                    >
                      Acciones
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 min-w-56 overflow-hidden rounded-2xl bg-card p-1.5 shadow-card"
                    >
                      <DropdownMenu.Item asChild>
                        <button
                          onClick={exportStatement}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-left text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-accent"
                          type="button"
                        >
                          <Download className="h-4 w-4" />
                          Exportar
                        </button>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-accent"
                          href={`/inversionistas/nuevo?sourceInvestorId=${investorId}`}
                        >
                          <Plus className="h-4 w-4" />
                          Nueva inversión
                        </Link>
                      </DropdownMenu.Item>
                      {investments.length === 1 && (
                        <>
                          <DropdownMenu.Separator className="my-1 h-px bg-border-soft" />
                          <DropdownMenu.Item asChild>
                            <button
                              className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-accent"
                              type="button"
                              onClick={(event) => {
                                event.currentTarget.focus();
                                setPaymentInvestmentId(investments[0].id);
                              }}
                            >
                              <Banknote className="h-4 w-4" />
                              Registrar pago
                            </button>
                          </DropdownMenu.Item>
                        </>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((k, index) => {
            const Icon = k.icon;
            return (
              <Card
                key={k.label}
                className={`${pageEntryStatCardClassName(index)} relative flex min-h-[160px] flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5 ${index === 0 ? 'bg-highlight text-text-primary' : 'bg-card'}`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.iconClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{k.label}</p>
                  <p className="text-lg font-bold tabular-nums">{k.value}</p>
                  <p className={`mt-1.5 text-xs font-medium text-text-secondary`}>{k.detail}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <nav
          aria-label="Secciones del inversionista"
          className="scrollbar-none mb-6 flex items-center gap-2 overflow-x-auto"
        >
          {TABS.map((t, i) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === i}
              onClick={() => setTab(i)}
              className={`min-h-11 shrink-0 rounded-xl px-5 py-2 text-sm font-bold transition ${tab === i ? 'bg-highlight text-text-primary shadow-card' : 'text-text-secondary hover:bg-card hover:text-primary'}`}
            >
              {t}
              {i === 1 && documents.length > 0 && (
                <span className="ml-2 text-xs opacity-70">{documents.length}</span>
              )}
            </button>
          ))}
        </nav>

        {tab === 0 && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Inversiones del inversionista
                  </h3>
                  <p className="mt-0.5 text-xs text-text-subtle">
                    Capital, rendimiento y vencimientos de cada inversión
                  </p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-accent">
                  {investments.length} {investments.length === 1 ? 'inversión' : 'inversiones'}
                </span>
              </div>
              {investments.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center">
                  <p className="text-sm text-text-subtle">Sin inversiones registradas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className={`grid min-w-[1000px] ${investmentTableColumns} items-center bg-surface-subtle px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-text-muted`}
                  >
                    <span>Código</span>
                    <span>Capital</span>
                    <span>Interés mensual</span>
                    <span>Próximo pago</span>
                    <span>Estado</span>
                    <span>Tasa</span>
                  </div>
                  {investments.map((investment) => {
                    const paymentStatus = investment.paymentStatus ?? 'SCHEDULED';
                    const statusVisual = investmentPaymentStatusVisuals[paymentStatus];
                    return (
                      <Link
                        key={investment.id}
                        className={`grid min-h-16 min-w-[1000px] ${investmentTableColumns} items-center border-t border-border-soft px-6 py-3 text-sm text-text-secondary transition hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-accent`}
                        href={`/inversiones/${investment.id}`}
                      >
                        <span className="font-semibold tabular-nums text-text-primary">
                          {investment.code}
                        </span>
                        <span className="font-semibold tabular-nums text-text-primary">
                          {fmt(investment.capital)}
                        </span>
                        <span className="font-semibold tabular-nums text-text-primary">
                          {fmt(investment.monthlyPayment)}
                        </span>
                        <span className="tabular-nums">
                          {investment.nextDueDate ? fmtDate(investment.nextDueDate) : '—'}
                        </span>
                        <span>
                          <span
                            className={`inline-flex min-h-7 min-w-[88px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em] ${statusVisual.className}`}
                          >
                            {statusVisual.label}
                          </span>
                        </span>
                        <span className="tabular-nums">{investment.rate}% mensual</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {data.notes && (
              <div className="rounded-2xl bg-primary-soft p-5 shadow-card">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-accent">
                  Notas
                </p>
                <p className="text-sm text-text-secondary">{data.notes}</p>
              </div>
            )}
          </div>
        )}

        {documentError && (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-state-danger-bg p-4 text-sm text-state-danger"
          >
            {documentError}
          </p>
        )}
        {tab === 1 && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-sky px-5 text-sm text-white hover:bg-primary-hover">
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Subir documento'}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="py-12 text-center text-sm text-text-subtle">Sin documentos adjuntos.</p>
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-2xl bg-card px-6 py-4 shadow-card hover:bg-primary-soft/30 transition"
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

        {tab === 2 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {personalFields.map((r) => (
              <div key={r.label} className="rounded-2xl bg-card px-6 py-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  {r.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {refreshError && (
        <p role="alert" className="px-6 pb-4 text-sm text-state-danger">
          El pago se registró, pero no se pudo actualizar el saldo. Recarga el estado de cuenta.
        </p>
      )}
      <InvestorPaymentDialog
        investmentId={paymentInvestmentId}
        onClose={() => setPaymentInvestmentId(null)}
        onPaid={() => {
          setRefreshError(false);
          void getInvestor(investorId)
            .then(setData)
            .catch(() => setRefreshError(true));
        }}
      />
    </div>
  );
}
