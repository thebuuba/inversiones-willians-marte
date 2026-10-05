'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  UserRoundCheck,
  UserRoundPlus,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { getClients, type ClientListFilter, type ClientListItem } from '@/lib/api/clients';
import { formatShortDate } from '@/lib/date-format';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from '@/lib/page-entry-animation';
import { useClientCache } from '@/lib/use-client-cache';
import { Card as PanelCard } from '@/components/ui/card';
import { calculateClientPageSize } from './clients-pagination';

const columns =
  'grid-cols-[64px_minmax(250px,2.2fr)_minmax(170px,1fr)_minmax(185px,1.15fr)_minmax(150px,.9fr)_44px]';
const avatarColors = [
  'bg-primary-soft text-primary',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-pink-100 text-pink-700',
];

function EmptyField() {
  return <span className="text-text-muted/75">Sin registrar</span>;
}

function clientName(client: ClientListItem) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export function ClientsPanel() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<ClientListFilter>('ALL');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const fits = calculateClientPageSize(entry.contentRect.height, window.innerWidth);
      setPageSize((prev) => {
        if (prev !== fits) setPage(0);
        return fits;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const clientsFetcher = useCallback(
    () => getClients(search || undefined, pageSize, page * pageSize, filter),
    [page, search, pageSize, filter],
  );
  const { data, loading, error } = useClientCache(
    `clients:${search}:${filter}:${page}:${pageSize}`,
    clientsFetcher,
    undefined,
    'No se pudieron cargar los clientes. Verifica que el backend esté corriendo.',
    true,
  );
  const initialLoading = loading && !data;
  const clients = data?.data ?? [];
  const total = data?.total ?? 0;
  const globalStats = data?.stats;
  const globalTotal = globalStats?.total ?? total;
  const totalPages = Math.ceil(total / pageSize);
  const stats = [
    {
      label: 'Total clientes',
      value: String(globalTotal),
      detail: 'registrados en el sistema',
      icon: UsersRound,
      bg: 'bg-white',
      color: 'text-brand-sky',
      blue: true,
    },
    {
      label: 'Activos',
      value: String(globalStats?.active ?? 0),
      detail: 'con préstamo vigente',
      icon: UserRoundCheck,
      bg: 'bg-emerald-100',
      color: 'text-emerald-700',
      blue: false,
    },
    {
      label: 'Sin préstamos',
      value: String(globalStats?.withoutLoans ?? 0),
      detail: 'listos para ofertar',
      icon: UserRoundX,
      bg: 'bg-amber-100',
      color: 'text-amber-700',
      blue: false,
    },
    {
      label: 'Nuevos (30d)',
      value: String(globalStats?.recent ?? 0),
      detail: `vs. ${globalStats?.previousRecent ?? 0} el mes pasado`,
      icon: UserRoundPlus,
      bg: 'bg-pink-100',
      color: 'text-pink-700',
      blue: false,
    },
  ];
  const filters: { key: ClientListFilter; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'CURRENT', label: 'Al día' },
    { key: 'OVERDUE', label: 'Atrasados' },
    { key: 'NEW', label: 'Nuevos' },
  ];
  const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => startPage + index,
  );

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(0);
    }, 300);
  }

  async function exportClients() {
    setExporting(true);
    setExportError('');
    try {
      const rows: ClientListItem[] = [];
      let offset = 0;
      let count = 0;
      do {
        const result = await getClients(search || undefined, 100, offset, filter);
        rows.push(...result.data);
        offset += result.data.length;
        count = result.total;
        if (result.data.length === 0) break;
      } while (offset < count);
      const escape = (value: string | number) => {
        const text = String(value);
        const safe = /^[=+@-]/.test(text) ? `'${text}` : text;
        return `"${safe.replaceAll('"', '""')}"`;
      };
      const lines = [
        ['ID', 'Cliente', 'Cédula', 'Contacto', 'Préstamos activos'].join(','),
        ...rows.map((client) =>
          [
            client.id,
            clientName(client),
            client.identification ?? '',
            client.phone ?? '',
            client.activeLoans ?? '—',
          ]
            .map(escape)
            .join(','),
        ),
      ];
      const url = URL.createObjectURL(
        new Blob(['\ufeff', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clientes.csv';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('No se pudo exportar la lista de clientes.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-top))] flex-col bg-page p-4 font-sans text-text-primary md:h-[calc(100dvh-4rem-env(safe-area-inset-top))] md:min-h-0 md:overflow-hidden md:p-5">
      <div className="flex w-full flex-col gap-7 md:min-h-0 md:flex-1">
        <header
          className={`${pageEntryHeaderClassName} flex flex-col justify-between gap-4 xl:flex-row xl:items-center`}
        >
          <div>
            <h1 className="text-3xl font-extrabold leading-tight text-text-primary">Clientes</h1>
            <p className="mt-1 text-sm text-text-secondary">Administra tu cartera de clientes</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex h-11 items-center gap-2 rounded-[18px] border border-border-soft bg-card px-5 text-sm font-bold text-text-primary shadow-card transition-colors hover:bg-surface-subtle disabled:opacity-50"
              disabled={exporting}
              onClick={exportClients}
              type="button"
            >
              <Download className="h-4 w-4 text-brand-sky" aria-hidden="true" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </button>
            <Link
              className="flex h-11 items-center gap-2 rounded-[18px] bg-brand-sky px-5 text-sm font-bold text-white shadow-action transition-colors hover:bg-primary"
              href="/clientes/nuevo"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar cliente
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <PanelCard
                key={stat.label}
                className={`${pageEntryStatCardClassName(index)} relative flex h-[136px] flex-col justify-between overflow-hidden p-4 shadow-card ${stat.blue ? 'bg-brand-sky text-white shadow-action' : 'bg-card transition-shadow hover:shadow-md'}`}
              >
                {stat.blue && (
                  <>
                    <span className="pointer-events-none absolute -right-5 -top-12 h-32 w-32 rounded-full bg-white/10" />
                    <span className="pointer-events-none absolute -bottom-16 right-10 h-28 w-28 rounded-full bg-white/10" />
                  </>
                )}
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-sm font-bold">{stat.label}</p>
                  <p className="mt-1 text-lg font-extrabold leading-none">
                    {initialLoading ? '...' : stat.value}
                  </p>
                  <p
                    className={`mt-1.5 truncate text-xs ${stat.blue ? 'text-white/85' : 'text-text-secondary'}`}
                  >
                    {stat.detail}
                  </p>
                </div>
              </PanelCard>
            );
          })}
        </div>

        {(error || exportError) && (
          <div className="rounded-panel border border-state-danger/30 bg-state-danger-bg px-5 py-3 text-sm font-medium text-state-danger">
            {error || exportError}
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-3 rounded-[32px] border border-border-soft bg-card p-3 shadow-sm md:flex-row md:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-muted-ui px-4 focus-within:ring-2 focus-within:ring-primary-border">
            <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="sr-only">Buscar clientes</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, ID, cédula o teléfono..."
            />
          </label>
          <div
            className="flex shrink-0 items-center gap-1 self-end rounded-full bg-surface-muted-ui p-1"
            role="group"
            aria-label="Filtrar clientes"
          >
            {filters.map((item) => (
              <button
                key={item.key}
                aria-pressed={filter === item.key}
                className={`flex h-8 items-center justify-center rounded-full px-4 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${filter === item.key ? 'bg-[#ffd83d] text-[#25251e] shadow-sm' : 'text-text-secondary hover:bg-card'}`}
                onClick={() => {
                  setFilter(item.key);
                  setPage(0);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <PanelCard
          className={`${pageEntryTableClassName} flex flex-col overflow-hidden bg-card md:min-h-0 md:flex-1`}
        >
          <div className="min-h-0 flex-1 overflow-x-auto">
            <div className="flex h-full min-w-[920px] flex-col">
              <div
                className={`grid h-11 shrink-0 ${columns} items-center border-b border-border-soft bg-surface-subtle px-5 text-xs font-semibold text-text-secondary`}
              >
                <span>ID</span>
                <span>Cliente</span>
                <span>Cédula</span>
                <span>Contacto</span>
                <span>Préstamos activos</span>
                <span />
              </div>

              <div ref={bodyRef} className="relative min-h-[320px] flex-1 bg-card md:min-h-0">
                {initialLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                    Cargando clientes...
                  </div>
                ) : clients.length === 0 ? (
                  <div className="flex h-full min-h-32 items-center justify-center text-sm text-text-secondary">
                    {search
                      ? `No se encontraron clientes para "${search}"`
                      : 'No se encontraron clientes.'}
                  </div>
                ) : (
                  clients.map((client) => {
                    const name = clientName(client);
                    return (
                      <div
                        key={client.id}
                        aria-label={`Abrir cliente ${name}`}
                        className={`group grid h-16 ${columns} cursor-pointer items-center border-b border-border-soft px-5 text-sm transition-colors last:border-b-0 hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-primary`}
                        onClick={() => router.push(`/clientes/${client.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget)
                            router.push(`/clientes/${client.id}`);
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <span className="font-semibold tabular-nums text-text-secondary">
                          {client.id}
                        </span>
                        <div className="flex min-w-0 items-center gap-3">
                          {client.photo ? (
                            <div
                              aria-label={name}
                              className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                              role="img"
                              style={{ backgroundImage: `url(${client.photo})` }}
                            />
                          ) : (
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[client.id % avatarColors.length]}`}
                            >
                              {`${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-text-primary">{name}</p>
                            <p className="mt-0.5 truncate text-xs text-text-secondary">
                              Cliente desde {formatShortDate(client.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="truncate text-text-secondary">
                          {client.identification || <EmptyField />}
                        </span>
                        <span className="truncate text-text-secondary">
                          {client.phone ? (
                            <a
                              className="inline-flex items-center gap-2 hover:text-primary"
                              href={`tel:${client.phone}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Phone className="h-3.5 w-3.5 text-brand-sky" aria-hidden="true" />
                              {client.phone}
                            </a>
                          ) : (
                            <EmptyField />
                          )}
                        </span>
                        <span>
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-soft px-2 text-xs font-bold text-primary">
                            {client.activeLoans ?? '—'}
                          </span>
                        </span>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              aria-label={`Acciones de ${name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted-ui"
                              onClick={(event) => event.stopPropagation()}
                              type="button"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              className="z-50 min-w-36 rounded-xl border border-border-soft bg-card p-1 text-sm shadow-card"
                            >
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 outline-none hover:bg-primary-soft focus:bg-primary-soft"
                                onSelect={() => router.push(`/clientes/${client.id}`)}
                              >
                                Ver cliente
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 outline-none hover:bg-primary-soft focus:bg-primary-soft"
                                onSelect={() => router.push(`/clientes/${client.id}/editar`)}
                              >
                                Editar
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex min-h-16 shrink-0 items-center justify-between border-t border-border-soft px-5">
                <p className="text-sm text-text-secondary">
                  {!initialLoading && (
                    <>
                      Mostrando <strong className="text-text-primary">{clients.length}</strong> de{' '}
                      <strong className="text-text-primary">{total}</strong> clientes
                    </>
                  )}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      aria-label="Página anterior"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted-ui text-text-secondary disabled:opacity-50"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      type="button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {visiblePages.map((number) => (
                      <button
                        key={number}
                        aria-label={`Página ${number + 1}`}
                        aria-current={page === number ? 'page' : undefined}
                        className={`h-9 w-9 rounded-full text-sm font-bold ${page === number ? 'bg-brand-sky text-white shadow-action' : 'text-text-secondary hover:bg-surface-muted-ui'}`}
                        onClick={() => setPage(number)}
                        type="button"
                      >
                        {number + 1}
                      </button>
                    ))}
                    <button
                      aria-label="Página siguiente"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted-ui text-text-secondary disabled:opacity-50"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                      type="button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
