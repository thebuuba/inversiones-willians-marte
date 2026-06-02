'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  WalletCards,
} from 'lucide-react';
import { getLoans, type LoanListItem } from '@/lib/api/loans';
import { getStaggerDelay } from '@/lib/animation';
import { useClientCache } from '@/lib/use-client-cache';

const statusFilters = ['Todos', 'Al día', 'Atrasados', 'Pendientes', 'Pagados'];
const sortOptions = ['Más recientes', 'Más antiguos', 'Mayor monto', 'Menor monto'];

function loanToRow(loan: LoanListItem) {
  const clientName = `${loan.client.firstName} ${loan.client.lastName}`;
  const detail = `${loan.client.identification ?? '—'}`;
  const paidSchedules = Math.round(
    loan.principal > 0 ? ((loan.principal - loan.balance) / loan.principal) * loan.term : 0,
  );
  const totalSchedules = loan.term;
  const percent = loan.principal > 0 ? Math.round(((loan.principal - loan.balance) / loan.principal) * 100) : 0;
  const nextPayment = '—';

  let statusLabel: string;
  if (loan.status === 'ACTIVE') statusLabel = 'Al día';
  else if (loan.status === 'OVERDUE') statusLabel = 'Atrasado';
  else if (loan.status === 'PAID') statusLabel = 'Pagado';
  else if (loan.status === 'RESTRUCTURED') statusLabel = 'Pendiente';
  else statusLabel = 'Pendiente';

  const typeLabel = loan.product?.name ?? '—';

  return {
    id: loan.id,
    client: clientName,
    detail,
    type: typeLabel,
    amount: loan.principal,
    interest: `${loan.interestRate}% interés`,
    progress: `${paidSchedules}/${totalSchedules} cuotas`,
    percent,
    nextPayment,
    status: statusLabel,
  };
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.045) },
  }),
};

function PanelCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function LoansHeader({ total, amount }: { total: number; amount: string }) {
  return (
    <motion.header
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9CDBB]">GESTIÓN</p>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#151918]">Préstamos</h1>
        <p className="mt-1.5 text-base font-medium text-[#7A7F7D]">
          Administra los préstamos activos — {total} registrados, RD$ {amount} colocados.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#3F4542] shadow-[0_6px_14px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-md" type="button">
          <Download className="h-4 w-4" />
          Exportar
        </button>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.22)] transition hover:-translate-y-0.5 hover:bg-[#4F9B76]"
          href="/prestamos/nuevo"
        >
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </Link>
      </div>
    </motion.header>
  );
}

function LoanSummaryCards({ items }: { items: ReturnType<typeof loanToRow>[] }) {
  const total = items.length;
  const alDia = items.filter((i) => i.status === 'Al día').length;
  const atrasados = items.filter((i) => i.status === 'Atrasado').length;
  const pendientes = items.filter((i) => i.status === 'Pendiente').length;
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalAmountStr = totalAmount >= 1_000_000
    ? `${(totalAmount / 1_000_000).toFixed(1)}M`
    : totalAmount >= 1_000 ? `${(totalAmount / 1_000).toFixed(0)}K` : String(totalAmount);

  return (
    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <SummaryCard icon={<WalletCards className="h-6 w-6" />} iconBg="#EAF6EF" iconColor="#4F9B76" label="CARTERA TOTAL" subtext={`${total} préstamos`} value={`RD$ ${totalAmountStr}`} />
      <SummaryCard icon={<CheckCircle2 className="h-6 w-6" />} iconBg="#B8DCC5" iconColor="#4F9B76" label="AL DÍA" subtext="préstamos saludables" value={String(alDia)} />
      <SummaryCard icon={<AlertCircle className="h-6 w-6" />} iconBg="#FADCCB" iconColor="#E05A1A" label="ATRASADOS" subtext="requieren atención" value={String(atrasados)} />
      <SummaryCard icon={<Clock3 className="h-6 w-6" />} iconBg="#FFF1C7" iconColor="#B7791F" label="PENDIENTES" subtext="por desembolsar" value={String(pendientes)} />
    </div>
  );
}

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subtext,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <PanelCard className="flex min-h-[124px] items-center gap-5 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">{label}</p>
        <p className="mt-2 text-[26px] font-bold leading-none text-[#151918]">{value}</p>
        <p className="mt-2 text-sm font-medium text-[#9B9F9D]">{subtext}</p>
      </div>
    </PanelCard>
  );
}

function SelectControl({
  icon,
  value,
  onChange,
  options,
}: {
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="relative flex h-12 min-w-[230px] items-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
      <span className="text-[#7CC99B]">{icon}</span>
      <select
        className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-sm font-bold text-[#151918] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B5AD]" />
    </label>
  );
}

function LoanStatusPills({ activeStatus, onChange }: { activeStatus: string; onChange: (status: string) => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      <span className="flex items-center gap-2 text-sm font-bold text-[#7A7F7D]">
        <Filter className="h-5 w-5 text-[#8CA096]" />
        Estado:
      </span>
      {statusFilters.map((status) => (
        <button
          className={`h-9 rounded-full px-4 text-sm font-bold transition hover:-translate-y-0.5 ${
            activeStatus === status
              ? 'bg-[#173D2C] text-white shadow-[0_9px_16px_rgba(23,61,44,0.18)]'
              : 'bg-[#EAF6EF] text-[#5FA37D] hover:bg-[#DFF1E7]'
          }`}
          key={status}
          onClick={() => onChange(status)}
          type="button"
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function LoanFilters({
  search,
  selectedStatus,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: {
  search: string;
  selectedStatus: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
}) {
  return (
    <PanelCard className="mb-5 p-5" index={5}>
      <div className="flex flex-col gap-3 xl:flex-row">
        <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F4F5F6] px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
          <Search className="h-5 w-5 text-[#A7B5AD]" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#173D2C] outline-none placeholder:text-[#747882]"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por cliente, cédula o ID de préstamo..."
            value={search}
          />
        </label>
        <SelectControl icon={<Clock3 className="h-5 w-5" />} onChange={onSortChange} options={sortOptions} value={sort} />
      </div>
      <LoanStatusPills activeStatus={selectedStatus} onChange={onStatusChange} />
    </PanelCard>
  );
}

const badgeColors = ['bg-[#FFF1C7] text-[#B7791F]', 'bg-[#EAF6EF] text-[#4F9B76]', 'bg-[#DCEBFF] text-[#2563EB]', 'bg-[#E9DDFB] text-[#7C3AED]', 'bg-[#FADCCB] text-[#D94E1F]'];
function LoanTypeBadge({ type }: { type: string }) {
  const idx = Math.abs(type.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % badgeColors.length;
  return <span className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-bold ${badgeColors[idx]}`}>{type}</span>;
}

function LoanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { className: string; dot: string; label: string }> = {
    'Al día': { className: 'bg-[#EAF6EF] text-[#5FA37D]', dot: '#7CC99B', label: 'Al día' },
    Atrasado: { className: 'bg-[#FADCCB] text-[#D94E1F]', dot: '#FF6A00', label: 'Atrasado' },
    Pendiente: { className: 'bg-[#FFF1C7] text-[#B7791F]', dot: '#F3B51B', label: 'Pendiente' },
    Pagado: { className: 'bg-[#EEF0F2] text-[#555A58]', dot: '#B9BCBE', label: 'Pagado' },
  };
  const style = styles[status];

  return (
    <span className={`inline-flex min-w-[82px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${style.className}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {style.label}
    </span>
  );
}

function ProgressCell({ progress, percent }: { progress: string; percent: number }) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-[#777D7A]">{progress}</span>
        <span className="font-bold text-[#3F4542]">{percent}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#F0F2F3]">
        <div className="h-full rounded-full bg-[#7CC99B]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

type LoanRowData = ReturnType<typeof loanToRow>;

function LoanRow({ loan, index }: { loan: LoanRowData; index: number }) {
  return (
    <motion.div
      animate="visible"
      className={`grid min-w-[1180px] grid-cols-[2.15fr_1.35fr_1.4fr_1.85fr_1.2fr_1.65fr] items-center border-t border-[#EDF2EF] px-6 py-4 transition hover:bg-[#F8FBF9] ${
        index === 3 ? 'bg-[#F6FAF7]' : 'bg-white'
      }`}
      custom={index + 7}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#EAF6EF] text-[#5FA37D] shadow-[0_6px_14px_rgba(40,92,67,0.13)]">
            <span className="text-sm font-bold">{loan.client.charAt(0)}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-[#151918]">{loan.client}</p>
          <p className="mt-1 text-sm font-medium text-[#777D7A]">{loan.detail}</p>
        </div>
      </div>
      <LoanTypeBadge type={loan.type} />
      <div>
        <p className="text-sm font-bold text-[#151918]">RD$ {loan.amount.toLocaleString()}</p>
        <p className="mt-1 text-sm font-medium text-[#777D7A]">{loan.interest}</p>
      </div>
      <ProgressCell percent={loan.percent} progress={loan.progress} />
      <p className="text-sm font-medium text-[#3F4542]">{loan.nextPayment}</p>
      <div className="flex items-center justify-end gap-4">
        <LoanStatusBadge status={loan.status} />
        <button className="px-1 text-lg font-bold leading-none text-[#A7B5AD] transition hover:text-[#5FA37D]" type="button">
          ...
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#B8EBC9] bg-[#EAF6EF] px-4 text-sm font-bold text-[#5FA37D] shadow-[0_5px_10px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => undefined}
          type="button"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      </div>
    </motion.div>
  );
}

function Pagination({ count, total, page, totalPages, onPrev, onNext }: { count: number; total: number; page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex min-w-[1180px] items-center justify-between border-t border-[#EDF2EF] px-6 py-4">
      <p className="text-sm font-medium text-[#777D7A]">Mostrando {count} de {total} préstamos</p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EDF2EF] bg-white text-[#777D7A] disabled:opacity-30"
            disabled={page === 0}
            onClick={onPrev}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-[#777D7A]">{page + 1} / {totalPages}</span>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EDF2EF] bg-white text-[#777D7A] disabled:opacity-30"
            disabled={page >= totalPages - 1}
            onClick={onNext}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function LoansTable({ rows, total, page, totalPages, onPrev, onNext }: { rows: LoanRowData[]; total: number; page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <PanelCard className="overflow-hidden" index={6}>
      <div className="overflow-x-auto">
        <div className="grid min-w-[1180px] grid-cols-[2.15fr_1.35fr_1.4fr_1.85fr_1.2fr_1.65fr] bg-[#F7F7F7] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#777D7A]">
          <span>CLIENTE</span>
          <span>TIPO</span>
          <span>MONTO</span>
          <span>PROGRESO</span>
          <span>PRÓX. PAGO</span>
          <span className="flex items-center justify-end gap-1">ESTADO <ChevronDown className="h-4 w-4" /></span>
        </div>
        {rows.map((loan, index) => (
          <LoanRow index={index} key={loan.id} loan={loan} />
        ))}
        <Pagination count={rows.length} total={total} page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
      </div>
    </PanelCard>
  );
}

function normalizeStatusFilter(status: string) {
  if (status === 'Al día') return 'ACTIVE';
  if (status === 'Atrasados') return 'OVERDUE';
  if (status === 'Pendientes') return 'RESTRUCTURED';
  if (status === 'Pagados') return 'PAID';
  return status;
}

export function LoansPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [sort, setSort] = useState('Más recientes');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const PAGE_SIZE = 50;
  const searchKey = `${search}|${selectedStatus}`;
  const statusParam = normalizeStatusFilter(selectedStatus);
  const loansFetcher = useCallback(
    () => getLoans(statusParam === 'Todos' ? undefined : statusParam, search || undefined, PAGE_SIZE, page * PAGE_SIZE),
    [page, search, statusParam],
  );
  const { data, loading } = useClientCache(
    `loans:${searchKey}:${page}`,
    loansFetcher,
  );
  const loans = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const rows = useMemo(() => {
    return loans.map(loanToRow);
  }, [loans]);

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 300);
  }

  function handleStatusChange(value: string) {
    setSelectedStatus(value);
    setPage(0);
  }

  return (
    <main className="min-h-screen bg-[#F4F5F6] p-5 font-sans text-[#173D2C]">
      <div className="mx-auto max-w-[1640px]">
        <LoansHeader total={total} amount={
          total > 0
            ? (loans.reduce((s, l) => s + l.principal, 0) >= 1_000_000
              ? `${(loans.reduce((s, l) => s + l.principal, 0) / 1_000_000).toFixed(1)}M`
              : `${(loans.reduce((s, l) => s + l.principal, 0) / 1_000).toFixed(0)}K`)
            : '0'
        } />
        {!loading && <LoanSummaryCards items={rows} />}
        <LoanFilters
          onSearchChange={handleSearch}
          onSortChange={setSort}
          onStatusChange={handleStatusChange}
          search={search}
          selectedStatus={selectedStatus}
          sort={sort}
        />
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-medium text-[#A9CDBB]">Cargando préstamos...</div>
        ) : (
          <LoansTable rows={rows} total={total} page={page} totalPages={totalPages} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        )}
      </div>
    </main>
  );
}
