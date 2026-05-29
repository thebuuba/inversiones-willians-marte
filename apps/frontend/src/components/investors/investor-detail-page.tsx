'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getInvestor } from '@/lib/api/investors';
import { getDocuments, createDocument } from '@/lib/api/documents';
import type { InvestorItem, DocumentItem } from '@inversiones/shared';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CircleCheck,
  CircleAlert,
  Clock,
  Download,
  Eye,
  File,
  Plus,
  Printer,
  TrendingUp,
  Phone,
  Mail,
  Upload,
} from 'lucide-react';

const fmt = (n: number) => `RD$ ${n.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;
const fmtDate = (s: string | Date) => new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pagado: { bg: '#eaf5ed', text: '#5a9a7a', dot: '#7fb89a', label: 'Pagado' },
  pendiente: { bg: '#fef3c7', text: '#a16207', dot: '#eab308', label: 'Pendiente' },
  atrasado: { bg: '#fde4d4', text: '#c2410c', dot: '#f97316', label: 'Atrasado' },
};

const TABS = ['Resumen', 'Historial de pagos', 'Documentos', 'Datos personales'];

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? STATUS_COLOR.pendiente;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

export function InvestorDetailPage({ investorId }: { investorId: string }) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<InvestorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getInvestor(investorId),
      getDocuments(undefined, investorId).catch(() => [] as DocumentItem[]),
    ])
      .then(([investor, docs]) => {
        setData(investor);
        setDocuments(docs);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [investorId]);

  const capital = data?.capital ?? 0;
  const rate = data?.rate ?? 0;
  const monthlyReturn = Math.round(capital * rate / 100);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Inversionista no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-[#5a9a7a] underline" href="/inversionistas">
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const statsCards = [
    { label: 'Capital invertido', value: fmt(capital), icon: Banknote, accent: '#eaf5ed', color: '#5a9a7a' },
    { label: 'Total pagado', value: fmt(0), icon: CircleCheck, accent: '#c2dfcb', color: '#5a9a7a' },
    { label: 'Tasa de retorno', value: `${rate}% mensual`, icon: TrendingUp, accent: '#fef3c7', color: '#a16207' },
    { label: 'Retorno mensual', value: fmt(monthlyReturn), icon: Calendar, accent: '#dbeafe', color: '#1d4ed8' },
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
      fd.append('file', file);
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
    <div className="min-h-screen bg-[#F3F4F6] font-sans">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5a9a7a] hover:text-[#7fb89a]"
          href="/inversionistas"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a inversionistas
        </Link>

        <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm border border-neutral-100">
          <div className="px-8 pt-6 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5">
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt={data.name}
                    className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#eaf5ed] shadow-md">
                    <TrendingUp className="h-8 w-8 text-[#5a9a7a]" />
                  </div>
                )}
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-neutral-900">{data.name}</h1>
                    <span className="rounded-full bg-[#eaf5ed] px-3 py-0.5 text-xs font-semibold text-[#5a9a7a]">
                      ✦ {data.status === 'ACTIVE' ? 'Activo' : data.status === 'PAUSED' ? 'Pausado' : 'Retirado'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {data.code} · {data.cedula ?? '—'} · {data.type}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
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
                <button className="inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 text-sm text-neutral-700 hover:bg-neutral-50">
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                <Link
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#5a9a7a] px-5 text-sm text-white hover:bg-[#4a866a]"
                  href="/inversionistas/pago"
                >
                  <Plus className="h-4 w-4" />
                  Registrar pago
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsCards.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: k.accent, color: k.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">{k.label}</p>
                    <p className="mt-0.5 text-base font-bold text-neutral-900">{k.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5 flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-neutral-100">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                tab === i ? 'bg-[#5a9a7a] text-white shadow-sm' : 'text-neutral-500 hover:bg-[#eaf5ed] hover:text-[#5a9a7a]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-900">Estado de pagos</h3>
                  <span className="text-sm font-bold text-[#5a9a7a]">0/0 pagados</span>
                </div>
                <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7fb89a] to-[#5a9a7a]" style={{ width: '0%' }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([['pagado', CircleCheck], ['pendiente', Clock], ['atrasado', CircleAlert]] as const).map(([s, StatusIcon]) => {
                    const c = STATUS_COLOR[s];
                    return (
                      <div key={s} className="flex items-center gap-2.5 rounded-xl p-3" style={{ backgroundColor: c.bg }}>
                        <StatusIcon className="h-4 w-4 shrink-0" style={{ color: c.text }} />
                        <div>
                          <p className="text-xs font-medium" style={{ color: c.text }}>{c.label}</p>
                          <p className="text-lg font-bold" style={{ color: c.text }}>0</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
                <h3 className="mb-4 text-sm font-semibold text-neutral-900">Condiciones pactadas</h3>
                <div className="space-y-3">
                  {conditions.map((r) => (
                    <div key={r.label} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0 gap-3">
                      <span className="text-xs text-neutral-500 shrink-0">{r.label}</span>
                      <span className="text-sm font-semibold text-neutral-900 text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {data.notes && (
                <div className="rounded-2xl bg-[#eaf5ed] p-5 border border-[#c2dfcb]/60">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5a9a7a]">Notas</p>
                  <p className="text-sm text-neutral-700">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-100">
            <div className="grid grid-cols-12 gap-4 border-b border-neutral-100 bg-[#fafafa] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Período</div>
              <div className="col-span-2">Vencimiento</div>
              <div className="col-span-2">Fecha pago</div>
              <div className="col-span-2">Monto</div>
              <div className="col-span-1">Método</div>
              <div className="col-span-2 text-right">Estado / Acción</div>
            </div>
            <div className="py-12 text-center text-sm text-neutral-400">
              No hay pagos registrados aún.
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#5a9a7a] px-5 text-sm text-white hover:bg-[#4a866a]">
                <Upload className="h-4 w-4" />
                Subir documento
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-400">Sin documentos adjuntos.</p>
            ) : (
              documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm border border-neutral-100 hover:bg-[#eaf5ed]/30 transition">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5ed]">
                      <File className="h-5 w-5 text-[#5a9a7a]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{d.name}</p>
                      <p className="text-xs text-neutral-500">
                        {d.category} · Subido {fmtDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  {d.fileUrl && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/../uploads/${d.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-neutral-500 hover:bg-[#eaf5ed] hover:text-[#5a9a7a]"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {personalFields.map((r) => (
              <div key={r.label} className="rounded-2xl bg-white px-6 py-4 shadow-sm border border-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{r.label}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
