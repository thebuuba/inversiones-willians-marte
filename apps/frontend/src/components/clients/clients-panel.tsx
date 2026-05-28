'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Download,
  Filter,
  List,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { getClients } from '@/lib/api/clients';
import type { Client } from '@inversiones/shared';

const filters = ['Todos', 'Activos', 'Inactivos'];

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
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLoading(true);
    getClients(search || undefined)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [search]);

  const stats = useMemo(() => {
    const total = clients.length;
    const activos = clients.filter((c) => c.active).length;
    const inactivos = total - activos;
    const nuevos = clients.filter((c) => {
      const daysSinceCreation = (Date.now() - new Date(c.createdAt).getTime()) / 86400000;
      return daysSinceCreation <= 30;
    }).length;
    return [
      { label: 'Total clientes', value: String(total), icon: UsersRound, bg: '#E7F4EC', color: '#5FA37D' },
      { label: 'Activos', value: String(activos), icon: UsersRound, bg: '#DDEFE5', color: '#285C43' },
      { label: 'Inactivos', value: String(inactivos), icon: UsersRound, bg: '#EEF3EF', color: '#7A8A80' },
      { label: 'Nuevos (30d)', value: String(nuevos), icon: UserRound, bg: '#D8E9FF', color: '#4E7CAD' },
    ];
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filter === 'Activos') return c.active;
      if (filter === 'Inactivos') return !c.active;
      return true;
    });
  }, [clients, filter]);

  const fullName = (c: Client) => `${c.firstName} ${c.lastName}`;
  const clientStatus = (c: Client) => (c.active ? 'Activo' : 'Inactivo') as keyof typeof statusStyles;

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(value), 300);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9CDBB]">GESTIÓN</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#173D2C]">Clientes</h1>
          <p className="mt-1.5 text-base text-[#7A8A80]">
            Administra tu cartera de clientes — {clients.length} registrados en total.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#5FA37D] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.22)] transition hover:-translate-y-0.5"
            href="/clientes/nuevo"
          >
            <Plus className="h-4 w-4" />
            Agregar cliente
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
                <p className={`mt-1 text-[24px] font-bold leading-none text-[#173D2C]`}>
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula, teléfono..."
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

      <PanelCard className="overflow-hidden" index={6}>
        <div className="grid grid-cols-[2fr_1.35fr_1.55fr_1fr_0.8fr] items-center bg-[#F7F7F7] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#777D7A]">
          <span>CLIENTE</span>
          <span>CÉDULA</span>
          <span>TELÉFONO</span>
          <span>ESTADO</span>
          <span className="text-right">ACCIÓN</span>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-[#777D7A]">
              Cargando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-[#A7B5AD]">
              No se encontraron clientes.
            </div>
          ) : (
            filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index + 7}
                className="grid min-h-[74px] cursor-pointer grid-cols-[2fr_1.35fr_1.55fr_1fr_0.8fr] items-center border-t border-[#EDF2EF] px-6 text-[#5FA37D] transition hover:bg-[#F4FAF6] bg-white"
                onClick={() => router.push(`/clientes/${client.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0">
                    {client.photo ? (
                      <div
                        aria-label={fullName(client)}
                        className="h-full w-full rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]"
                        role="img"
                        style={{ backgroundImage: `url(${client.photo})` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_6px_14px_rgba(40,92,67,0.12)]">
                        <UserRound className="h-5 w-5 text-[#5FA37D]" />
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        client.active ? 'bg-[#7CC99B]' : 'bg-[#A9CDBB]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-[#173D2C]">{fullName(client)}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#A9CDBB]">
                      {client._count?.loans ?? 0} préstamo(s)
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-[#7A8A80]">{client.identification ?? '—'}</span>
                <span className="text-sm text-[#7A8A80]">{client.phone ?? '—'}</span>
                <StatusPill status={clientStatus(client)} />
                <div className="flex items-center justify-end gap-3">
                  <button
                    className="rounded-full bg-[#E7F4EC] px-4 py-1.5 text-sm font-bold text-[#5FA37D] transition hover:bg-[#DDEFE5]"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/clientes/${client.id}`);
                    }}
                    type="button"
                  >
                    Ver
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#DDEBE3] bg-[#F7F7F7] px-6 py-4">
          <p className="text-sm font-semibold text-[#777D7A]">
            {!loading && (
              <>
                Mostrando <span className="font-bold text-[#173D2C]">{filteredClients.length}</span> de{' '}
                <span className="font-bold text-[#173D2C]">{clients.length}</span> clientes
              </>
            )}
          </p>
        </div>
      </PanelCard>

      <button className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_12px_24px_rgba(255,106,0,0.28)]">
        <List className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  );
}
