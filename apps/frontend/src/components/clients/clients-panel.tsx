'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Download,
  Filter,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { getClients } from '@/lib/api/clients';
import type { Client } from '@inversiones/shared';

const filters = ['Todos', 'Activos', 'Inactivos'];

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
      className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function ClientsPanel() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLoading(true);
    setError('');
    getClients(search || undefined)
      .then(setClients)
      .catch((err) => {
        if (err?.response?.status === 401) return;
        setError('No se pudieron cargar los clientes. Verifica que el backend esté corriendo.');
      })
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

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(value), 300);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-neutral-900">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">GESTIÓN</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#173D2C]">Clientes</h1>
          <p className="mt-1.5 text-base text-neutral-500">
            Administra tu cartera de clientes — {clients.length} registrados en total.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-[#5a9a7a] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                <p className="text-sm font-semibold text-neutral-500">{stat.label}</p>
                <p className={`mt-1 text-[24px] font-bold leading-none text-neutral-900`}>
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </PanelCard>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <PanelCard className="mb-5 p-5" index={5}>
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F4F5F6] px-5 shadow-[0_4px_10px_rgba(40,92,67,0.06)]">
            <Search className="h-5 w-5 shrink-0 text-neutral-400" />
            <input
              className="flex-1 bg-transparent text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula, teléfono..."
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Filter className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-bold text-neutral-400">Estado:</span>
          {filters.map((f) => (
            <button
              key={f}
              className={`h-9 rounded-full px-4 text-sm font-bold transition hover:-translate-y-0.5 ${
                filter === f
                  ? 'bg-[#285C43] text-white shadow-[0_10px_18px_rgba(40,92,67,0.18)]'
                  : 'border border-neutral-200 bg-white text-neutral-600'
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </PanelCard>

      <PanelCard className="overflow-hidden" index={6}>
        <div className="grid grid-cols-[0.5fr_2fr_1.2fr_1.4fr_0.7fr] items-center bg-[#F7F7F7] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
          <span>ID</span>
          <span>CLIENTE</span>
          <span>CÉDULA</span>
          <span>TELÉFONO</span>
          <span className="text-right">PRÉSTAMOS</span>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-neutral-500">
              Cargando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm font-medium text-neutral-400">
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
                className="grid min-h-[74px] cursor-pointer grid-cols-[0.5fr_2fr_1.2fr_1.4fr_0.7fr] items-center border-t border-neutral-100 px-6 transition hover:bg-[#F4FAF6] bg-white"
                onClick={() => router.push(`/clientes/${client.id}`)}
              >
                <span className="font-mono text-xs text-neutral-400">{client.id}</span>
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
                        <UserRound className="h-5 w-5 text-neutral-500" />
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        client.active ? 'bg-[#7CC99B]' : 'bg-[#A9CDBB]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-neutral-900">{fullName(client)}</p>
                    <p className="mt-0.5 text-xs font-medium text-neutral-400">
                      {client._count?.loans ?? 0} préstamo(s)
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-neutral-500">{client.identification ?? '—'}</span>
                <span className="text-sm text-neutral-500">{client.phone ?? '—'}</span>
                <span className="inline-flex min-w-[28px] items-center justify-center justify-self-end rounded-md bg-[#E7F4EC] px-2 py-1 text-xs font-bold text-[#5FA37D]">{client._count?.loans ?? 0}</span>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 bg-[#F7F7F7] px-6 py-4">
          <p className="text-sm font-semibold text-neutral-500">
            {!loading && (
              <>
                Mostrando <span className="font-bold text-neutral-900">{filteredClients.length}</span> de{' '}
                <span className="font-bold text-neutral-900">{clients.length}</span> clientes
              </>
            )}
          </p>
        </div>
      </PanelCard>

    </div>
  );
}
