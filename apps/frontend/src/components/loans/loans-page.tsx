'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  HandCoins,
  Plus,
  Search,
  WalletCards,
} from 'lucide-react';
import { getLoans, type LoanListItem } from '@/lib/api/loans';
import { getStaggerDelay } from '@/lib/animation';
import { useClientCache } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import { getLoanTypeLabel } from '@/lib/loan-type';

const statusFilters = ['Todos', 'Al día', 'Pendientes', 'Atrasados', 'Vencidos', 'Pagados'];
const sortOptions = ['Más recientes', 'Más antiguos', 'Mayor monto', 'Menor monto'];

function loanToRow(loan: LoanListItem) {
  const clientName = `${loan.client.firstName} ${loan.client.lastName}`;
  const detail = `${loan.client.identification ?? '—'}`;
  const paidSchedules = loan.paidInstallments;
  const totalSchedules = loan.totalInstallments;
  const percent = loan.paymentProgress;
  const nextPayment = loan.nextPaymentDate
    ? new Date(loan.nextPaymentDate).toLocaleDateString('es-DO')
    : 'Sin cuotas pendientes';

  const collectionLabels = {
    CURRENT: 'Al día',
    PENDING: 'Pendiente',
    LATE: 'Atrasado',
    EXPIRED: 'Vencido',
  } as const;
  const statusLabel = loan.status === 'PAID' ? 'Pagado' : collectionLabels[loan.collectionStatus];

  const typeLabel = getLoanTypeLabel(loan.interestType, loan.interestRate);

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

function PanelCard({
  children,
  className = '',
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-panel border border-border-soft bg-card shadow-card ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function LoansHeader({ total, totalPrincipal }: { total: number; totalPrincipal: number }) {
  return (
    <motion.header
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">GESTIÓN</p>
        <h1 className="mt-1.5 text-3xl font-bold leading-tight text-text-primary">Préstamos</h1>
        <p className="mt-1.5 text-base font-medium text-text-muted">
          Administra los préstamos activos — {total} registrados,{' '}
          {formatDop(totalPrincipal, { space: true })} colocados.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-primary shadow-[0_6px_14px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-card"
          type="button"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#B8DCC5] bg-primary-soft px-5 text-sm font-bold text-primary-accent transition hover:-translate-y-0.5 hover:bg-[#DCEFE3]"
          href="/prestamos/cobrar"
        >
          <HandCoins className="h-4 w-4" />
          Registrar cobro
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5 hover:bg-primary"
          href="/prestamos/nuevo"
        >
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </Link>
      </div>
    </motion.header>
  );
}

function LoanSummaryCards({
  items,
  totalPrincipal,
}: {
  items: ReturnType<typeof loanToRow>[];
  totalPrincipal: number;
}) {
  const total = items.length;
  const alDia = items.filter((i) => i.status === 'Al día').length;
  const atrasados = items.filter((i) => i.status === 'Atrasado').length;
  const pendientes = items.filter((i) => i.status === 'Pendiente').length;
  return (
    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <SummaryCard
        icon={<WalletCards className="h-6 w-6" />}
        iconBg="#EAF6EF"
        iconColor="#285C43"
        label="CARTERA TOTAL"
        subtext={`${total} préstamos`}
        value={formatDop(totalPrincipal, { space: true })}
      />
      <SummaryCard
        icon={<CheckCircle2 className="h-6 w-6" />}
        iconBg="#B8DCC5"
        iconColor="#285C43"
        label="AL DÍA"
        subtext="préstamos saludables"
        value={String(alDia)}
      />
      <SummaryCard
        icon={<AlertCircle className="h-6 w-6" />}
        iconBg="#FADCCB"
        iconColor="#E05A1A"
        label="ATRASADOS"
        subtext="requieren atención"
        value={String(atrasados)}
      />
      <SummaryCard
        icon={<Clock3 className="h-6 w-6" />}
        iconBg="#FFF1C7"
        iconColor="#7A5A0A"
        label="PENDIENTES"
        subtext="por desembolsar"
        value={String(pendientes)}
      />
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
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-text-muted">{label}</p>
        <p className="mt-2 text-3xl font-bold leading-none text-text-primary">{value}</p>
        <p className="mt-2 text-sm font-medium text-text-secondary">{subtext}</p>
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
    <label className="relative flex h-12 min-w-[230px] items-center gap-3 rounded-full border border-primary-border bg-card px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
      <span className="text-[#7CC99B]">{icon}</span>
      <select
        className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-sm font-bold text-text-primary outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
    </label>
  );
}

function LoanStatusPills({
  activeStatus,
  onChange,
}: {
  activeStatus: string;
  onChange: (status: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      <span className="flex items-center gap-2 text-sm font-bold text-text-muted">
        <Filter className="h-5 w-5 text-text-secondary" />
        Estado:
      </span>
      {statusFilters.map((status) => (
        <button
          className={`h-11 rounded-full px-4 text-sm font-bold transition hover:-translate-y-0.5 md:h-9 ${
            activeStatus === status
              ? 'bg-primary-accent text-text-inverse shadow-action'
              : 'bg-primary-soft text-primary-accent hover:bg-surface-muted-ui'
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
        <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-primary-border bg-page px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
          <Search className="h-5 w-5 text-text-subtle" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-subtle"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por cliente, cédula o ID de préstamo..."
            value={search}
          />
        </label>
        <SelectControl
          icon={<Clock3 className="h-5 w-5" />}
          onChange={onSortChange}
          options={sortOptions}
          value={sort}
        />
      </div>
      <LoanStatusPills activeStatus={selectedStatus} onChange={onStatusChange} />
    </PanelCard>
  );
}

function LoanTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex justify-self-start rounded-full border border-primary-border bg-surface-subtle px-3 py-1 text-xs font-bold text-primary-accent">
      {type}
    </span>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { className: string; label: string }> = {
    'Al día': { className: 'bg-[#4F956B] text-white', label: 'A tiempo' },
    Atrasado: { className: 'bg-[#E7A923] text-[#2F2A1E]', label: 'Atrasado' },
    Pendiente: { className: 'bg-[#4B5054] text-white', label: 'Pendiente' },
    Vencido: { className: 'bg-[#C95349] text-white', label: 'Vencido' },
    Pagado: { className: 'bg-[#437EAF] text-white', label: 'Terminado' },
  };
  const style = styles[status];

  return (
    <span
      className={`inline-flex min-h-7 min-w-[88px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em] ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function ProgressCell({ progress, percent }: { progress: string; percent: number }) {
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-text-secondary">{progress}</span>
        <span className="font-bold text-text-primary">{percent}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-surface-muted-ui">
        <div
          className="h-full rounded-full bg-primary-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type LoanRowData = ReturnType<typeof loanToRow>;

function LoanRow({ loan, index }: { loan: LoanRowData; index: number }) {
  return (
    <motion.div
      animate="visible"
      className="border-t border-border-soft bg-card px-4 py-4 transition hover:bg-surface-subtle md:grid md:min-w-[1180px] md:grid-cols-[2.15fr_1.1fr_1.35fr_1.85fr_1.25fr_1.65fr] md:items-center md:px-6 md:py-3.5"
      custom={index + 7}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-primary">{loan.client}</p>
            <p className="mt-1 truncate text-xs font-medium text-text-secondary">{loan.detail}</p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-control-comfortable bg-surface-subtle p-3">
          <div>
            <p className="text-xs font-bold uppercase text-text-muted">Monto</p>
            <p className="mt-1 text-sm font-bold text-text-primary">
              {formatDop(loan.amount, { space: true })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-text-muted">Próximo pago</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{loan.nextPayment}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <LoanTypeBadge type={loan.type} />
          <div className="flex items-center gap-2">
            <Link
              aria-label={`Cobrar préstamo de ${loan.client}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-border text-text-secondary"
              href={`/prestamos/cobrar?loanId=${loan.id}`}
            >
              <HandCoins className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-bold text-primary-accent"
              href={`/prestamos/${loan.id}`}
            >
              <Eye className="h-4 w-4" />
              Ver
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-bold leading-tight text-text-primary">{loan.client}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{loan.detail}</p>
      </div>
      <div className="hidden md:block">
        <LoanTypeBadge type={loan.type} />
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-bold text-text-primary">
          {formatDop(loan.amount, { space: true })}
        </p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{loan.interest}</p>
      </div>
      <div className="hidden md:block">
        <ProgressCell percent={loan.percent} progress={loan.progress} />
      </div>
      <p className="hidden text-sm font-medium text-text-primary md:block">{loan.nextPayment}</p>
      <div className="hidden items-center justify-end gap-2.5 md:flex">
        <LoanStatusBadge status={loan.status} />
        <Link
          aria-label={`Cobrar préstamo de ${loan.client}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-border text-text-secondary transition hover:border-[#B8DCC5] hover:bg-primary-soft hover:text-primary-accent"
          href={`/prestamos/cobrar?loanId=${loan.id}`}
          title="Registrar cobro"
        >
          <HandCoins className="h-4 w-4" />
        </Link>
        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#B8EBC9] bg-primary-soft px-4 text-sm font-bold text-primary-accent shadow-[0_5px_10px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-card"
          href={`/prestamos/${loan.id}`}
        >
          <Eye className="h-4 w-4" />
          Ver
        </Link>
      </div>
    </motion.div>
  );
}

function Pagination({
  count,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  count: number;
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between border-t border-border-soft px-4 py-4 md:min-w-[1180px] md:px-6">
      <p className="text-sm font-medium text-text-secondary">
        Mostrando {count} de {total} préstamos
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-card text-text-secondary disabled:opacity-30 md:h-9 md:w-9"
            disabled={page === 0}
            onClick={onPrev}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-text-secondary">
            {page + 1} / {totalPages}
          </span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-card text-text-secondary disabled:opacity-30 md:h-9 md:w-9"
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

function LoansTable({
  rows,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  rows: LoanRowData[];
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <PanelCard className="overflow-hidden" index={6}>
      <div className="overflow-hidden md:overflow-x-auto">
        <div className="hidden min-w-[1180px] grid-cols-[2.15fr_1.1fr_1.35fr_1.85fr_1.25fr_1.65fr] bg-surface-subtle px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:grid">
          <span>CLIENTE</span>
          <span>AMORTIZACIÓN</span>
          <span>MONTO</span>
          <span>PROGRESO</span>
          <span>PRÓX. PAGO</span>
          <span className="flex items-center justify-end gap-1">
            ESTADO <ChevronDown className="h-4 w-4" />
          </span>
        </div>
        {rows.map((loan, index) => (
          <LoanRow index={index} key={loan.id} loan={loan} />
        ))}
        <Pagination
          count={rows.length}
          total={total}
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </PanelCard>
  );
}

function normalizeStatusFilter(status: string) {
  if (status === 'Al día') return 'CURRENT';
  if (status === 'Atrasados') return 'LATE';
  if (status === 'Pendientes') return 'PENDING';
  if (status === 'Vencidos') return 'EXPIRED';
  if (status === 'Pagados') return 'PAID';
  return status;
}

function normalizeSort(sort: string): 'recent' | 'oldest' | 'amount_desc' | 'amount_asc' {
  if (sort === 'Más antiguos') return 'oldest';
  if (sort === 'Mayor monto') return 'amount_desc';
  if (sort === 'Menor monto') return 'amount_asc';
  return 'recent';
}

export function LoansPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(() => searchParams.get('search')?.trim() ?? '');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [sort, setSort] = useState('Más recientes');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const PAGE_SIZE = 20;
  const searchKey = `${search}|${selectedStatus}`;
  const statusParam = normalizeStatusFilter(selectedStatus);
  const sortParam = normalizeSort(sort);
  const loansFetcher = useCallback(
    () =>
      getLoans(
        statusParam === 'Todos' ? undefined : statusParam,
        search || undefined,
        PAGE_SIZE,
        page * PAGE_SIZE,
        sortParam,
      ),
    [page, search, sortParam, statusParam],
  );
  const { data, loading } = useClientCache(`loans:${searchKey}:${sortParam}:${page}`, loansFetcher);
  const loans = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPrincipal = data?.totalPrincipal ?? 0;
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
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mx-auto max-w-[1640px]">
        <LoansHeader total={total} totalPrincipal={totalPrincipal} />
        {!loading && <LoanSummaryCards items={rows} totalPrincipal={totalPrincipal} />}
        <LoanFilters
          onSearchChange={handleSearch}
          onSortChange={setSort}
          onStatusChange={handleStatusChange}
          search={search}
          selectedStatus={selectedStatus}
          sort={sort}
        />
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-medium text-text-secondary">
            Cargando préstamos...
          </div>
        ) : (
          <LoansTable
            rows={rows}
            total={total}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </div>
    </main>
  );
}
