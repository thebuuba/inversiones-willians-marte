'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  List,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Search,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';

const filters = ['Todos', 'Activos', 'Pausados', 'Retirados'];

const investors = [
  {
    name: 'Francisco Núñez Lara',
    code: 'INV-012',
    since: 'desde Sep 2022',
    capital: 'RD$1,200,000',
    rate: '4% / mes',
    monthly: 'RD$48.0K',
    earned: 'RD$768.0K',
    status: 'Activo',
    next: 'Próx. 01 Oct 2024',
    avatar: 'https://i.pravatar.cc/96?img=13',
  },
  {
    name: 'Gabriel Tavárez Soto',
    code: 'INV-006',
    since: 'desde Oct 2022',
    capital: 'RD$850,000',
    rate: '3.9% / mes',
    monthly: 'RD$33.1K',
    earned: 'RD$530.4K',
    status: 'Activo',
    next: 'Próx. 01 Oct 2024',
    avatar: 'https://i.pravatar.cc/96?img=56',
  },
  {
    name: 'Hernán Castillo Reyes',
    code: 'INV-010',
    since: 'desde Jul 2023',
    capital: 'RD$750,000',
    rate: '3.8% / mes',
    monthly: 'RD$28.5K',
    earned: 'RD$342.0K',
    status: 'Pausado',
    next: 'Próx. Pausado',
    avatar: 'https://i.pravatar.cc/96?img=5',
  },
  {
    name: 'Lucía Espinal Ortiz',
    code: 'INV-007',
    since: 'desde Abr 2023',
    capital: 'RD$600,000',
    rate: '3.7% / mes',
    monthly: 'RD$22.2K',
    earned: 'RD$333.0K',
    status: 'Activo',
    next: 'Próx. 01 Oct 2024',
    avatar: 'https://i.pravatar.cc/96?img=13',
  },
  {
    name: 'Roberto Almonte Vega',
    code: 'INV-014',
    since: 'desde Ene 2023',
    capital: 'RD$500,000',
    rate: '3.5% / mes',
    monthly: 'RD$17.5K',
    earned: 'RD$210.0K',
    status: 'Activo',
    next: 'Próx. 01 Oct 2024',
    avatar: 'https://i.pravatar.cc/96?img=12',
  },
  {
    name: 'Andrés Rosario Fernández',
    code: 'INV-008',
    since: 'desde Mar 2023',
    capital: 'RD$450,000',
    rate: '3.5% / mes',
    monthly: 'RD$15.8K',
    earned: 'RD$220.5K',
    status: 'Retirado',
    next: 'Próx. Retirado',
    avatar: 'https://i.pravatar.cc/96?img=32',
  },
];

const statusStyles = {
  Activo: { bg: '#E7F4EC', text: '#5FA37D', dot: '#7CC99B', ring: '#7CC99B' },
  Pausado: { bg: '#FFF4C8', text: '#A98219', dot: '#E2C64F', ring: '#E2C64F' },
  Retirado: { bg: '#EEF3EF', text: '#7A8A80', dot: '#A9CDBB', ring: '#A9CDBB' },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 },
  }),
};

function PanelCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-[18px] border border-[#DDEBE3] bg-white shadow-[0_7px_22px_rgba(40,92,67,0.035)] ${className}`}
    >
      {children}
    </motion.section>
  );
}

function StatusPill({ status }: { status: keyof typeof statusStyles }) {
  const style = statusStyles[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {status}
    </span>
  );
}

export function InvestorsPanel() {
  return (
    <div className="min-h-screen bg-[#F6FAF7] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9CDBB]">CAPITAL</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#173D2C]">Inversionistas</h1>
          <p className="mt-1.5 text-base text-[#5FA37D]">
            Personas que aportan capital a la empresa y reciben rendimiento mensual.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#5FA37D] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button className="flex h-11 items-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.22)] transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            Nuevo inversionista
          </button>
        </div>
      </motion.header>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2.05fr_1fr_1fr]">
        <PanelCard className="relative overflow-hidden border-0 bg-gradient-to-br from-[#D5EDDD] to-[#B8DCC5] p-7" index={1}>
          <div className="absolute right-7 top-7 flex h-14 w-14 items-center justify-center rounded-full bg-white/58 text-[#173D2C]">
            <PiggyBank className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#173D2C]">CAPITAL INVERTIDO TOTAL</p>
          <p className="mt-8 text-[38px] font-bold leading-none text-[#173D2C]">RD$4,000,000</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/76 px-3 py-1.5 text-sm font-bold text-[#173D2C]">
              <UsersRound className="h-4 w-4" />
              7 activos
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/76 px-3 py-1.5 text-sm font-bold text-[#173D2C]">
              <ArrowUpRight className="h-4 w-4" />
              3.50% promedio
            </span>
          </div>
        </PanelCard>

        <PanelCard className="border-[#F2DE9B] p-7" index={2}>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF4C8] text-[#B89A22]">
            <DollarSign className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#A9CDBB]">PAGO MENSUAL</p>
          <p className="mt-3 text-[30px] font-bold leading-none text-[#173D2C]">RD$147.7K</p>
          <p className="mt-4 text-sm font-bold text-[#A98219]">a distribuir este mes</p>
        </PanelCard>

        <PanelCard className="border-[#D8E9FF] p-7" index={3}>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E4F0FF] text-[#5C82B7]">
            <CalendarClock className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#A9CDBB]">PAGADO HISTÓRICO</p>
          <p className="mt-3 text-[30px] font-bold leading-none text-[#173D2C]">RD$2.68M</p>
          <p className="mt-4 text-sm font-bold text-[#5C82B7]">desde el inicio</p>
        </PanelCard>
      </div>

      <PanelCard className="mb-5 p-5" index={4}>
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-5 text-[#A9CDBB]">
            <Search className="h-5 w-5 shrink-0" />
            <span className="truncate text-sm">Buscar por nombre, ID o cédula...</span>
          </div>
          <button className="flex h-12 items-center justify-between gap-4 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-5 text-sm font-bold text-[#173D2C] transition hover:bg-[#F3FAF6] xl:w-[300px]">
            <span className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-[#A9CDBB]" />
              Ordenar: Mayor capital
            </span>
            <ChevronDown className="h-4 w-4 text-[#A9CDBB]" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Filter className="h-4 w-4 text-[#A9CDBB]" />
          <span className="text-sm font-bold text-[#A9CDBB]">Estado:</span>
          {filters.map((filter) => (
            <button
              key={filter}
              className={`h-9 rounded-full px-4 text-sm font-bold transition hover:-translate-y-0.5 ${
                filter === 'Todos'
                  ? 'bg-[#B89A22] text-white shadow-[0_10px_18px_rgba(184,154,34,0.22)]'
                  : 'border border-[#DDEBE3] bg-[#F3FAF6] text-[#5FA37D]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </PanelCard>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {investors.map((investor, index) => {
          const status = investor.status as keyof typeof statusStyles;
          const style = statusStyles[status];

          return (
            <PanelCard
              key={investor.code}
              className="p-5 transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(40,92,67,0.08)]"
              index={index + 5}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0">
                    <div
                      aria-label={investor.name}
                      className="h-full w-full rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]"
                      role="img"
                      style={{
                        backgroundImage: `url(${investor.avatar})`,
                        boxShadow: `0 0 0 2px ${style.ring}44, 0 6px 14px rgba(40,92,67,0.12)`,
                      }}
                    />
                    <span
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: style.dot }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-[#173D2C]">{investor.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#A9CDBB]">
                      {investor.code} <span className="mx-2 text-[#DDEBE3]">•</span> {investor.since}
                    </p>
                  </div>
                </div>
                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3FAF6] text-[#5FA37D] transition hover:bg-[#E7F4EC]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-[18px] bg-gradient-to-br from-[#E4F4E9] to-[#D9EFE0] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5FA37D]">CAPITAL INVERTIDO</p>
                <p className="mt-3 text-[26px] font-bold leading-none text-[#173D2C]">{investor.capital}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#5FA37D]">
                  <ArrowUpRight className="h-4 w-4" />
                  {investor.rate}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-[#F2DE9B] bg-[#FFF8DA] p-4">
                  <p className="text-xs font-bold uppercase text-[#B89A22]">PAGO MENSUAL</p>
                  <p className="mt-3 text-lg font-bold text-[#A98219]">{investor.monthly}</p>
                </div>
                <div className="rounded-[16px] border border-[#D8E9FF] bg-[#E4F0FF] p-4">
                  <p className="text-xs font-bold uppercase text-[#789DD0]">TOTAL GANADO</p>
                  <p className="mt-3 text-lg font-bold text-[#5C82B7]">{investor.earned}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EDF2EF] pt-4">
                <StatusPill status={status} />
                <span className="flex items-center gap-2 text-sm font-medium text-[#A9CDBB]">
                  <Calendar className="h-4 w-4" />
                  {investor.next}
                </span>
              </div>

              <button className="mt-4 h-11 w-full rounded-full border border-[#DDEBE3] bg-[#F3FAF6] text-sm font-bold text-[#5FA37D] transition hover:bg-[#E7F4EC]">
                Ver detalle
              </button>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard className="flex items-center justify-between p-5" index={12}>
        <p className="text-sm font-semibold text-[#5FA37D]">
          Mostrando <span className="font-bold text-[#173D2C]">1–6 de 9</span> inversionistas
        </p>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#A9CDBB] shadow-sm transition hover:text-[#5FA37D]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B89A22] text-sm font-bold text-white shadow-[0_10px_18px_rgba(184,154,34,0.22)]">
            1
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#5FA37D] shadow-sm">
            2
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5FA37D] shadow-sm transition hover:bg-[#E7F4EC]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </PanelCard>

      <button className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_12px_24px_rgba(255,106,0,0.28)]">
        <List className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  );
}
