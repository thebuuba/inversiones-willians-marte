'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react';

const stats = [
  { label: 'Total clientes', value: '12', icon: UsersRound, bg: '#E7F4EC', color: '#5FA37D' },
  { label: 'Activos', value: '7', icon: UsersRound, bg: '#DDEFE5', color: '#285C43' },
  { label: 'Morosos', value: '2', icon: UsersRound, bg: '#FFE3D2', color: '#C96F4A' },
  { label: 'Nuevos', value: '1', icon: UserRound, bg: '#D8E9FF', color: '#4E7CAD' },
];

const filters = ['Todos', 'Activos', 'Morosos', 'Nuevos', 'Inactivos'];

const clients = [
  {
    name: 'María González Pérez',
    code: 'CL-0142',
    id: '402-1234567-8',
    phone: '+1 (809) 555-0142',
    city: 'Santo Domingo',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=12',
  },
  {
    name: 'Carlos Reyes Núñez',
    code: 'CL-0141',
    id: '001-9876543-2',
    phone: '+1 (809) 555-0141',
    city: 'Santiago',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=32',
    selected: true,
  },
  {
    name: 'Laura Méndez Castillo',
    code: 'CL-0140',
    id: '402-5544332-1',
    phone: '+1 (829) 555-0140',
    city: 'La Vega',
    status: 'Moroso',
    avatar: 'https://i.pravatar.cc/96?img=13',
  },
  {
    name: 'Pedro Martínez Soto',
    code: 'CL-0139',
    id: '001-2233445-6',
    phone: '+1 (849) 555-0139',
    city: 'Puerto Plata',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=56',
  },
  {
    name: 'Sofía Hernández Rivera',
    code: 'CL-0138',
    id: '402-7788990-1',
    phone: '+1 (809) 555-0138',
    city: 'Santo Domingo',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=5',
  },
  {
    name: 'Roberto Díaz Almonte',
    code: 'CL-0137',
    id: '001-3344556-7',
    phone: '+1 (809) 555-0137',
    city: 'San Pedro',
    status: 'Inactivo',
    avatar: 'https://i.pravatar.cc/96?img=60',
  },
];

const statusStyles = {
  Activo: { bg: '#E7F4EC', text: '#5FA37D', dot: '#7CC99B' },
  Moroso: { bg: '#FFE3D2', text: '#C96F4A', dot: '#FFB174' },
  Inactivo: { bg: '#EEF3EF', text: '#7A8A80', dot: '#A9CDBB' },
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
      className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {status}
    </span>
  );
}

export function ClientsPanel() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F6FAF7] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9CDBB]">GESTIÓN</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#173D2C]">Clientes</h1>
          <p className="mt-1.5 text-base text-[#5FA37D]">
            Administra tu cartera de clientes — 12 registrados en total.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#5FA37D] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button className="flex h-11 items-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.22)] transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            Agregar cliente
          </button>
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
                <p className="text-sm font-semibold text-[#A9CDBB]">{stat.label}</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-[#173D2C]">{stat.value}</p>
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard className="mb-5 p-5" index={5}>
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-5 text-[#A9CDBB]">
            <Search className="h-5 w-5 shrink-0" />
            <span className="truncate text-sm">Buscar por nombre, ID, cédula, teléfono o email...</span>
          </div>
          <button className="flex h-12 items-center justify-between gap-4 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-5 text-sm font-bold text-[#173D2C] transition hover:bg-[#F3FAF6] xl:w-[270px]">
            <span className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#A9CDBB]" />
              Todas las ciudades
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
                  ? 'bg-[#285C43] text-white shadow-[0_10px_18px_rgba(40,92,67,0.18)]'
                  : 'border border-[#DDEBE3] bg-[#F3FAF6] text-[#5FA37D]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </PanelCard>

      <PanelCard className="overflow-hidden" index={6}>
        <div className="grid grid-cols-[2fr_1.35fr_1.55fr_1.35fr_1fr_0.8fr] items-center bg-[#F3FAF6] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#5FA37D]">
          <span>CLIENTE</span>
          <span>CÉDULA</span>
          <span>TELÉFONO</span>
          <span>CIUDAD</span>
          <span>ESTADO</span>
          <span className="text-right">ACCIÓN</span>
        </div>

        <div>
          {clients.map((client, index) => (
            <motion.div
              key={client.code}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index + 7}
              className={`grid min-h-[74px] cursor-pointer grid-cols-[2fr_1.35fr_1.55fr_1.35fr_1fr_0.8fr] items-center border-t border-[#EDF2EF] px-6 text-[#5FA37D] transition hover:bg-[#F4FAF6] ${
                client.selected ? 'bg-[#F4FAF6]' : 'bg-white'
              }`}
              onClick={() => router.push(`/clientes/${client.code.toLowerCase()}`)}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0">
                  <div
                    aria-label={client.name}
                    className="h-full w-full rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]"
                    role="img"
                    style={{ backgroundImage: `url(${client.avatar})` }}
                  />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#7CC99B]" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight text-[#173D2C]">{client.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#A9CDBB]">{client.code}</p>
                </div>
              </div>
              <span className="font-mono text-sm text-[#5FA37D]">{client.id}</span>
              <span className="text-sm text-[#5FA37D]">{client.phone}</span>
              <span className="text-sm text-[#5FA37D]">{client.city}</span>
              <StatusPill status={client.status as keyof typeof statusStyles} />
              <div className="flex items-center justify-end gap-3">
                {client.selected && <MoreHorizontal className="h-4 w-4 text-[#5FA37D]" />}
                <button
                  className="rounded-full bg-[#E7F4EC] px-4 py-1.5 text-sm font-bold text-[#5FA37D] transition hover:bg-[#DDEFE5]"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/clientes/${client.code.toLowerCase()}`);
                  }}
                  type="button"
                >
                  Ver
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[#DDEBE3] bg-[#F3FAF6] px-6 py-4">
          <p className="text-sm font-semibold text-[#5FA37D]">
            Mostrando <span className="font-bold text-[#173D2C]">1–6 de 12</span> clientes
          </p>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#A9CDBB] shadow-sm transition hover:text-[#5FA37D]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#285C43] text-sm font-bold text-white shadow-[0_10px_18px_rgba(40,92,67,0.18)]">
              1
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#5FA37D] shadow-sm">
              2
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5FA37D] shadow-sm transition hover:bg-[#E7F4EC]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PanelCard>

      <button className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_12px_24px_rgba(255,106,0,0.28)]">
        <List className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  );
}
