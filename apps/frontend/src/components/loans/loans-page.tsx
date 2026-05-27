'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  WalletCards,
} from 'lucide-react';

const loans = [
  {
    client: 'María González Pérez',
    detail: 'PR-2042 · 402-1234567-8',
    type: 'Cuota fija',
    amount: 'RD$ 150,000',
    interest: '18% interés',
    progress: '7/12 cuotas',
    percent: 60,
    nextPayment: '2025-12-12',
    status: 'Al día',
    avatar: 'https://i.pravatar.cc/96?img=12',
  },
  {
    client: 'Carlos Reyes Núñez',
    detail: 'PR-2041 · 001-9876543-2',
    type: 'Plazo fijo',
    amount: 'RD$ 850,000',
    interest: '14% interés',
    progress: '14/36 cuotas',
    percent: 38,
    nextPayment: '2025-12-01',
    status: 'Al día',
    avatar: 'https://i.pravatar.cc/96?img=32',
  },
  {
    client: 'Laura Méndez Castillo',
    detail: 'PR-2040 · 402-5544332-1',
    type: 'Plazo indefinido',
    amount: 'RD$ 500,000',
    interest: '16% interés',
    progress: '6/24 cuotas',
    percent: 22,
    nextPayment: '2025-11-20',
    status: 'Atrasado',
    avatar: 'https://i.pravatar.cc/96?img=13',
  },
  {
    client: 'Pedro Martínez Soto',
    detail: 'PR-2039 · 001-2233445-6',
    type: 'Plazo fijo',
    amount: 'RD$ 3,200,000',
    interest: '11% interés',
    progress: '18/120 cuotas',
    percent: 15,
    nextPayment: '2025-12-10',
    status: 'Al día',
    avatar: 'https://i.pravatar.cc/96?img=56',
  },
  {
    client: 'Sofía Hernández Rivera',
    detail: 'PR-2038 · 402-7788990-1',
    type: 'Cuota fija',
    amount: 'RD$ 75,000',
    interest: '19% interés',
    progress: '6/6 cuotas',
    percent: 100,
    nextPayment: '—',
    status: 'Pagado',
    avatar: 'https://i.pravatar.cc/96?img=5',
  },
  {
    client: 'Roberto Díaz Almonte',
    detail: 'PR-2037 · 001-3344556-7',
    type: 'Solo interés',
    amount: 'RD$ 220,000',
    interest: '12% interés',
    progress: '0/18 cuotas',
    percent: 0,
    nextPayment: '2025-12-25',
    status: 'Pendiente',
    avatar: '',
  },
  {
    client: 'Ana Rodríguez Vargas',
    detail: 'PR-2036 · 402-9988776-5',
    type: 'Cuota fija',
    amount: 'RD$ 95,000',
    interest: '18% interés',
    progress: '4/10 cuotas',
    percent: 40,
    nextPayment: '2025-12-15',
    status: 'Al día',
    avatar: 'https://i.pravatar.cc/96?img=22',
  },
  {
    client: 'Jorge Peña Vásquez',
    detail: 'PR-2035 · 001-5566778-9',
    type: 'Pago único',
    amount: 'RD$ 620,000',
    interest: '15% interés',
    progress: '5/30 cuotas',
    percent: 17,
    nextPayment: '2025-11-08',
    status: 'Atrasado',
    avatar: 'https://i.pravatar.cc/96?img=33',
  },
  {
    client: 'Carmen Liriano Polanco',
    detail: 'PR-2034 · 402-1122334-5',
    type: 'Plazo indefinido',
    amount: 'RD$ 1,200,000',
    interest: '13% interés',
    progress: '14/24 cuotas',
    percent: 60,
    nextPayment: '2025-12-12',
    status: 'Al día',
    avatar: 'https://i.pravatar.cc/96?img=47',
  },
];

const statusFilters = ['Todos', 'Al día', 'Atrasados', 'Pendientes', 'Pagados'];
const typeFilters = ['Todos los tipos', 'Cuota fija', 'Plazo fijo', 'Plazo indefinido', 'Solo interés', 'Pago único'];
const sortOptions = ['Más recientes', 'Más antiguos', 'Mayor monto', 'Menor monto'];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: index * 0.045 },
  }),
};

function PanelCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-[18px] border border-[#DDEBE3] bg-white shadow-[0_7px_22px_rgba(40,92,67,0.035)] ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function LoansHeader() {
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
          Administra los préstamos activos — 9 registrados, RD$ 6,910,000 colocados.
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

function LoanSummaryCards() {
  return (
    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <SummaryCard icon={<WalletCards className="h-6 w-6" />} iconBg="#EAF6EF" iconColor="#4F9B76" label="CARTERA TOTAL" subtext="9 préstamos" value="RD$ 6.91M" />
      <SummaryCard icon={<CheckCircle2 className="h-6 w-6" />} iconBg="#B8DCC5" iconColor="#4F9B76" label="AL DÍA" subtext="préstamos saludables" value="5" />
      <SummaryCard icon={<AlertCircle className="h-6 w-6" />} iconBg="#FADCCB" iconColor="#E05A1A" label="ATRASADOS" subtext="requieren atención" value="2" />
      <SummaryCard icon={<Clock3 className="h-6 w-6" />} iconBg="#FFF1C7" iconColor="#B7791F" label="PENDIENTES" subtext="por desembolsar" value="1" />
    </div>
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
  selectedType,
  sort,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onSortChange,
}: {
  search: string;
  selectedStatus: string;
  selectedType: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
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
        <SelectControl icon={<Filter className="h-5 w-5" />} onChange={onTypeChange} options={typeFilters} value={selectedType} />
        <SelectControl icon={<Clock3 className="h-5 w-5" />} onChange={onSortChange} options={sortOptions} value={sort} />
      </div>
      <LoanStatusPills activeStatus={selectedStatus} onChange={onStatusChange} />
    </PanelCard>
  );
}

function LoanTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    'Cuota fija': 'bg-[#FFF1C7] text-[#B7791F]',
    'Plazo fijo': 'bg-[#EAF6EF] text-[#4F9B76]',
    'Plazo indefinido': 'bg-[#DCEBFF] text-[#2563EB]',
    'Solo interés': 'bg-[#E9DDFB] text-[#7C3AED]',
    'Pago único': 'bg-[#FADCCB] text-[#D94E1F]',
  };

  return <span className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-bold ${styles[type]}`}>{type}</span>;
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

function LoanRow({ loan, index }: { loan: (typeof loans)[number]; index: number }) {
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
          {loan.avatar ? (
            <div
              aria-label={loan.client}
              className="h-full w-full rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.13)]"
              role="img"
              style={{ backgroundImage: `url(${loan.avatar})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_6px_14px_rgba(40,92,67,0.13)]">
              <span className="h-7 w-7 rounded-full border-[5px] border-dotted border-white" />
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#7CC99B]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-[#151918]">{loan.client}</p>
          <p className="mt-1 text-sm font-medium text-[#777D7A]">{loan.detail}</p>
        </div>
      </div>
      <LoanTypeBadge type={loan.type} />
      <div>
        <p className="text-sm font-bold text-[#151918]">{loan.amount}</p>
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

function Pagination({ count }: { count: number }) {
  return (
    <div className="flex min-w-[1180px] items-center justify-between border-t border-[#EDF2EF] px-6 py-4">
      <p className="text-sm font-medium text-[#777D7A]">Mostrando {count} de 9 préstamos</p>
      <div className="flex items-center gap-4 text-sm font-medium text-[#3F4542]">
        <button className="transition hover:text-[#5FA37D]" type="button">Anterior</button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5FA37D] font-bold text-white" type="button">1</button>
        <button className="transition hover:text-[#5FA37D]" type="button">2</button>
        <button className="transition hover:text-[#5FA37D]" type="button">Siguiente</button>
      </div>
    </div>
  );
}

function LoansTable({ rows }: { rows: typeof loans }) {
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
          <LoanRow index={index} key={loan.detail} loan={loan} />
        ))}
        <Pagination count={rows.length} />
      </div>
    </PanelCard>
  );
}

function normalizeStatusFilter(status: string) {
  if (status === 'Atrasados') return 'Atrasado';
  if (status === 'Pendientes') return 'Pendiente';
  if (status === 'Pagados') return 'Pagado';
  return status;
}

export function LoansPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos los tipos');
  const [sort, setSort] = useState('Más recientes');

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();
    const status = normalizeStatusFilter(selectedStatus);

    return loans
      .filter((loan) => {
        const matchesSearch = !query || `${loan.client} ${loan.detail}`.toLowerCase().includes(query);
        const matchesStatus = selectedStatus === 'Todos' || loan.status === status;
        const matchesType = selectedType === 'Todos los tipos' || loan.type === selectedType;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sort === 'Más antiguos') return a.detail.localeCompare(b.detail);
        if (sort === 'Mayor monto') return Number(b.amount.replace(/\D/g, '')) - Number(a.amount.replace(/\D/g, ''));
        if (sort === 'Menor monto') return Number(a.amount.replace(/\D/g, '')) - Number(b.amount.replace(/\D/g, ''));
        return b.detail.localeCompare(a.detail);
      });
  }, [search, selectedStatus, selectedType, sort]);

  return (
    <main className="min-h-screen bg-[#F4F5F6] p-5 font-sans text-[#173D2C]">
      <div className="mx-auto max-w-[1640px]">
        <LoansHeader />
        <LoanSummaryCards />
        <LoanFilters
          onSearchChange={setSearch}
          onSortChange={setSort}
          onStatusChange={setSelectedStatus}
          onTypeChange={setSelectedType}
          search={search}
          selectedStatus={selectedStatus}
          selectedType={selectedType}
          sort={sort}
        />
        <LoansTable rows={filteredLoans} />
      </div>
    </main>
  );
}
