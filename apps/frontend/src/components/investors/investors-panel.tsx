'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { deleteInvestor, getInvestors } from '@/lib/api/investors';
import { getStaggerDelay } from '@/lib/animation';
import { invalidateCache, useClientCache } from '@/lib/use-client-cache';
import { formatInvestorCurrency } from './investors-panel.helpers';
import type { InvestorItem } from '@inversiones/shared';

const filters = ['Todos', 'Activos', 'Pausados', 'Retirados'];

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: '#E7F4EC', text: '#5FA37D', dot: '#7CC99B' },
  PAUSED: { bg: '#FFF4C8', text: '#A98219', dot: '#E2C64F' },
  WITHDRAWN: { bg: '#EEF3EF', text: '#7A8A80', dot: '#A9CDBB' },
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  WITHDRAWN: 'Retirado',
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.05) },
  }),
};

function PanelCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </motion.section>
  );
}

function StatusPill({ status }: { status: string }) {
  const style = statusStyles[status] ?? statusStyles.WITHDRAWN;
  const label = statusLabels[status] ?? status;

  return (
    <span
      className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {label}
    </span>
  );
}

export function InvestorsPanel() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [deleteError, setDeleteError] = useState('');
  const { data, loading } = useClientCache<InvestorItem[]>('investors', getInvestors);
  const investors = useMemo(() => (data ?? []).filter((investor) => !deletedIds.has(investor.id)), [data, deletedIds]);

  const handleDeleteInvestor = async (investor: InvestorItem) => {
    const confirmed = window.confirm(`¿Seguro que quieres borrar a ${investor.name}? Esta acción eliminará sus pagos registrados y no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(investor.id);
    setDeleteError('');
    try {
      await deleteInvestor(investor.id);
      setDeletedIds((current) => new Set(current).add(investor.id));
      invalidateCache('investors');
      setOpenActionsId(null);
    } catch {
      setDeleteError('No se pudo borrar el inversionista. Intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = investors.length;
    const activos = investors.filter((i) => i.status === 'ACTIVE').length;
    const capitalTotal = investors.reduce((s, i) => s + Number(i.capital), 0);
    const tasaPromedio = total > 0 ? (investors.reduce((s, i) => s + i.rate, 0) / total).toFixed(1) : '0';
    return [
      { label: 'Total inversionistas', value: String(total), icon: UsersRound, bg: '#E7F4EC', color: '#5FA37D' },
      { label: 'Activos', value: String(activos), icon: UsersRound, bg: '#DDEFE5', color: '#285C43' },
      { label: 'Capital total', value: formatInvestorCurrency(capitalTotal), icon: TrendingUp, bg: '#FFF4C8', color: '#A98219' },
      { label: 'Tasa promedio', value: `${tasaPromedio}%`, icon: TrendingUp, bg: '#D8E9FF', color: '#4E7CAD' },
    ];
  }, [investors]);

  const filteredInvestors = useMemo(() => {
    const lower = search.toLowerCase();
    return investors.filter((i) => {
      if (filter === 'Activos') return i.status === 'ACTIVE';
      if (filter === 'Pausados') return i.status === 'PAUSED';
      if (filter === 'Retirados') return i.status === 'WITHDRAWN';
      return true;
    }).filter((i) => {
      if (!search) return true;
      return i.name.toLowerCase().includes(lower) || i.code.toLowerCase().includes(lower) || (i.cedula ?? '').toLowerCase().includes(lower);
    });
  }, [investors, filter, search]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9CDBB]">CAPITAL</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#173D2C]">Inversionistas</h1>
          <p className="mt-1.5 text-base text-[#7A8A80]">
            Administra tu cartera de capital — {investors.length} inversionistas registrados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#5FA37D] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-[#5a9a7a] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5"
            href="/inversionistas/nuevo"
          >
            <Plus className="h-4 w-4" />
            Agregar inversionista
          </Link>
        </div>
      </motion.header>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PanelCard key={stat.label} className="flex items-center gap-4 p-5" index={index + 1}>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#7A8A80]">{stat.label}</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-[#173D2C]">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard className="mb-5 p-5" index={5}>
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F4F5F6] px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
            <Search className="h-5 w-5 shrink-0 text-[#A7B5AD]" />
            <input
              className="flex-1 bg-transparent text-sm font-medium text-[#173D2C] outline-none placeholder:text-[#747882]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o cédula..."
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Filter className="h-4 w-4 text-[#A9CDBB]" />
          <span className="text-sm font-bold text-[#A9CDBB]">Estado:</span>
          {filters.map((f) => (
            <button
              key={f}
              className={`h-9 rounded-full px-4 text-sm font-bold transition hover:-translate-y-0.5 ${
                filter === f
                  ? 'bg-[#285C43] text-white shadow-[0_10px_18px_rgba(40,92,67,0.18)]'
                  : 'border border-[#DDEBE3] bg-[#F3FAF6] text-[#5FA37D]'
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </PanelCard>

      {deleteError && (
        <div className="mb-4 rounded-xl border border-[#F7C9C0] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[#B42318]">
          {deleteError}
        </div>
      )}

      <PanelCard className="overflow-visible" index={6}>
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.7fr] items-center bg-[#F7F7F7] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#777D7A]">
          <span>INVERSIONISTA</span>
          <span>CÓDIGO</span>
          <span>CAPITAL</span>
          <span>TASA</span>
          <span>ESTADO</span>
          <span className="text-right">ACCIONES</span>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-[#777D7A]">
              Cargando inversionistas...
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-[#A7B5AD]">
              No se encontraron inversionistas.
            </div>
          ) : (
            filteredInvestors.map((investor, index) => (
              <motion.div
                key={investor.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index + 7}
                className="grid min-h-[74px] cursor-pointer grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.7fr] items-center border-t border-[#EDF2EF] px-6 text-[#5FA37D] transition hover:bg-[#F4FAF6] bg-white"
                onClick={() => router.push(`/inversionistas/${investor.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0">
                    {investor.photo ? (
                      <div
                        aria-label={investor.name}
                        className="h-full w-full rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]"
                        role="img"
                        style={{ backgroundImage: `url(${investor.photo})` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_6px_14px_rgba(40,92,67,0.12)]">
                        <TrendingUp className="h-5 w-5 text-[#5FA37D]" />
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        investor.status === 'ACTIVE' ? 'bg-[#7CC99B]' : investor.status === 'PAUSED' ? 'bg-[#E2C64F]' : 'bg-[#A9CDBB]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-[#173D2C]">{investor.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#A9CDBB]">
                      {investor.cedula ? `Cédula: ${investor.cedula}` : '—'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-[#7A8A80]">{investor.code}</span>
                <span className="text-sm font-bold text-[#173D2C]">{formatInvestorCurrency(investor.capital)}</span>
                <span className="text-sm text-[#7A8A80]">{investor.rate}%</span>
                <StatusPill status={investor.status} />
                <div className="flex items-center justify-end gap-3">
                  <div className="relative">
                    <button
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#E7F4EC] px-4 text-sm font-bold text-[#5FA37D] transition hover:bg-[#DDEFE5]"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenActionsId((current) => (current === investor.id ? null : investor.id));
                      }}
                      type="button"
                    >
                      Acciones
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {openActionsId === investor.id && (
                      <div
                        className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-[#DDEBE3] bg-white p-2 text-left shadow-[0_18px_40px_rgba(40,92,67,0.16)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-[#285C43] transition hover:bg-[#F3FAF6]"
                          onClick={() => {
                            setOpenActionsId(null);
                            router.push(`/inversionistas/nuevo?investorId=${investor.id}`);
                          }}
                          type="button"
                        >
                          <Pencil className="h-4 w-4 text-[#5FA37D]" aria-hidden="true" />
                          Editar inversionista
                        </button>
                        <button
                          className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF3F1] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingId === investor.id}
                          onClick={() => void handleDeleteInvestor(investor)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {deletingId === investor.id ? 'Borrando...' : 'Borrar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#DDEBE3] bg-[#F7F7F7] px-6 py-4">
          <p className="text-sm font-semibold text-[#777D7A]">
            {!loading && (
              <>
                Mostrando <span className="font-bold text-[#173D2C]">{filteredInvestors.length}</span> de{' '}
                <span className="font-bold text-[#173D2C]">{investors.length}</span> inversionistas
              </>
            )}
          </p>
        </div>
      </PanelCard>
    </div>
  );
}
