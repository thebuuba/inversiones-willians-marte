'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getInvestor } from '@/lib/api/investors';
import { getDocuments, createDocument, downloadDocument } from '@/lib/api/documents';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';
import { formatDop } from '@/lib/currency';
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

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const investmentTableColumns =
  'grid-cols-[minmax(130px,0.9fr)_minmax(165px,1.1fr)_minmax(185px,1.2fr)_minmax(165px,1.1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)] gap-4 justify-items-center text-center';

const TABS = ['Resumen', 'Documentos', 'Datos personales'];

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
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm font-semibold text-white hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2"
                    >
                      Acciones
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 min-w-56 overflow-hidden rounded-panel border border-border-soft bg-card p-1.5 shadow-card"
                    >
                      <DropdownMenu.Item asChild>
                        <button
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
                            <Link
                              className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-accent"
                              href={`/inversionistas/pago?investmentId=${investments[0].id}`}
                            >
                              <Banknote className="h-4 w-4" />
                              Registrar pago
                            </Link>
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

        <div className="scrollbar-none mb-5 flex w-full gap-1 overflow-x-auto rounded-panel border border-border-soft bg-card p-1.5 shadow-card sm:w-fit">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`min-h-11 shrink-0 rounded-control-comfortable px-5 py-2 text-sm font-semibold transition ${
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
          <div className="space-y-5">
            <div className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Inversiones del inversionista
                  </h3>
                  <p className="mt-0.5 text-xs text-text-subtle">
                    Selecciona una fila para consultar la inversión
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
              <div className="rounded-panel bg-primary-soft p-5 border border-border-soft">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-accent">
                  Notas
                </p>
                <p className="text-sm text-text-secondary">{data.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
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

        {tab === 2 && (
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
