'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { getClients } from '@/lib/api/clients';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from '@/lib/page-entry-animation';
import { useClientCache } from '@/lib/use-client-cache';
import type { Client } from '@inversiones/shared';
import { calculateClientPageSize } from './clients-pagination';

function PanelCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border-soft bg-card shadow-card ${className}`}>
      {children}
    </section>
  );
}

function EmptyField() {
  return <span className="text-[13px] text-text-secondary/40">Sin registrar</span>;
}

export function ClientsPanel() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(8);
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const fits = calculateClientPageSize(entry.contentRect.height);
      setPageSize((prev) => {
        if (prev !== fits) setPage(0);
        return fits;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const clientsFetcher = useCallback(
    () => getClients(search || undefined, pageSize, page * pageSize),
    [page, search, pageSize],
  );
  const { data, loading, error } = useClientCache(
    `clients:${search}:${page}:${pageSize}`,
    clientsFetcher,
    undefined,
    'No se pudieron cargar los clientes. Verifica que el backend esté corriendo.',
    true,
  );
  const initialLoading = loading && !data;
  const clients = data?.data ?? [];
  const displayClients = clients.slice(0, pageSize);
  const total = data?.total ?? 0;
  const globalStats = data?.stats;
  const globalTotal = globalStats?.total ?? total;
  const totalPages = Math.ceil(total / pageSize);

  const stats = [
    {
      label: 'Total clientes',
      value: String(globalTotal),
      icon: UsersRound,
      bg: 'bg-primary-soft',
      color: 'text-primary-accent',
    },
    {
      label: 'Activos',
      value: String(globalStats?.active ?? globalTotal),
      icon: UsersRound,
      bg: 'bg-primary-soft',
      color: 'text-primary-accent',
    },
    {
      label: 'Sin préstamos',
      value: String(globalStats?.withoutLoans ?? 0),
      icon: UserRound,
      bg: 'bg-[#fff4c8]',
      color: 'text-[#7a5a0a]',
    },
    {
      label: 'Nuevos (30d)',
      value: String(globalStats?.recent ?? 0),
      icon: UserRound,
      bg: 'bg-[#e4f0ff]',
      color: 'text-[#2f5f91]',
    },
  ];

  const fullName = (c: Client) => `${c.firstName} ${c.lastName}`;

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 300);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F3F4F6] p-5 font-sans text-text-primary">
      <div className="flex w-full flex-1 flex-col gap-5">
        <header
          className={`${pageEntryHeaderClassName} flex flex-col justify-between gap-4 xl:flex-row xl:items-end`}
        >
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-text-primary">Clientes</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Administra tu cartera de clientes — {globalTotal} registrados en total.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-full border border-primary-border bg-white px-5 text-sm font-bold text-text-secondary transition-colors duration-150 hover:bg-[#f9fbfa] hover:text-text-primary">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <Link
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-primary-hover"
              href="/clientes/nuevo"
            >
              <Plus className="h-4 w-4" />
              Agregar cliente
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <PanelCard
                key={stat.label}
                className={`${pageEntryStatCardClassName(index)} flex items-center gap-4 p-5`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-text-secondary">{stat.label}</p>
                  <p className="mt-1 text-[22px] font-bold leading-none text-text-primary">
                    {initialLoading ? '...' : stat.value}
                  </p>
                </div>
              </PanelCard>
            );
          })}
        </div>

        {error && (
          <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <PanelCard
          className={`${pageEntryTableClassName} flex min-h-0 flex-1 flex-col overflow-hidden`}
        >
          <div className="border-b border-border-soft p-4">
            <div className="flex h-11 items-center gap-3 rounded-xl border border-transparent bg-[#f3f4f6] px-4 transition-colors duration-150 focus-within:border-primary-border focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-soft">
              <Search className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-secondary/60"
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula, teléfono..."
              />
            </div>
          </div>
          <div className="sticky top-0 z-10 grid grid-cols-[2.2fr_1.2fr_1.4fr_0.9fr_44px] items-center bg-[#f9fbfa] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
            <span>CLIENTE</span>
            <span>CÉDULA</span>
            <span>TELÉFONO</span>
            <span className="justify-self-end text-center">PRÉSTAMOS</span>
          </div>

          <div ref={bodyRef} className="relative flex-1 overflow-hidden">
            {initialLoading ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-text-secondary">
                Cargando clientes...
              </div>
            ) : displayClients.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-center text-sm font-medium text-text-secondary">
                {search
                  ? `No se encontraron clientes para "${search}"`
                  : 'No se encontraron clientes.'}
              </div>
            ) : (
              displayClients.map((client) => (
                <div
                  key={client.id}
                  className="group grid min-h-[64px] cursor-pointer grid-cols-[2.2fr_1.2fr_1.4fr_0.9fr_44px] items-center border-b border-border-soft bg-card px-6 transition-colors duration-150 last:border-b-0 hover:bg-[#f9fbfa]"
                  onClick={() => router.push(`/clientes/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0">
                      {client.photo ? (
                        <div
                          aria-label={fullName(client)}
                          className="h-full w-full rounded-full bg-cover bg-center"
                          role="img"
                          style={{ backgroundImage: `url(${client.photo})` }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-soft">
                          <UserRound className="h-4 w-4 text-primary-accent" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold leading-tight text-text-primary">
                        {fullName(client)}
                      </p>
                      <p className="mt-1 text-xs leading-tight text-text-secondary/70">
                        ID {client.id}
                      </p>
                    </div>
                  </div>
                  <span className="[font-variant-numeric:tabular-nums] text-sm text-text-secondary">
                    {client.identification ?? <EmptyField />}
                  </span>
                  <span className="[font-variant-numeric:tabular-nums] text-sm text-text-secondary">
                    {client.phone ?? <EmptyField />}
                  </span>
                  <span
                    className={`inline-flex h-8 min-w-8 items-center justify-center justify-self-end rounded-full px-3 text-sm font-bold leading-none ${
                      (client._count?.loans ?? 0) > 0
                        ? 'bg-primary-soft text-primary-accent'
                        : 'bg-[#eef3ef] text-text-secondary'
                    }`}
                  >
                    {client._count?.loans ?? 0}
                  </span>
                  <button
                    aria-label={`Acciones de ${fullName(client)}`}
                    className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-text-secondary opacity-0 transition-colors duration-150 hover:bg-[#eef3ef] hover:text-text-primary group-hover:opacity-100"
                    onClick={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border-soft bg-card px-6 py-4">
            <p className="text-[13px] text-text-secondary">
              {!initialLoading && (
                <>
                  Mostrando {displayClients.length} de {total} cliente{total !== 1 ? 's' : ''}
                </>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-border bg-white text-text-secondary transition-colors duration-150 hover:bg-[#f9fbfa] disabled:opacity-30"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-text-secondary">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-border bg-white text-text-secondary transition-colors duration-150 hover:bg-[#f9fbfa] disabled:opacity-30"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
