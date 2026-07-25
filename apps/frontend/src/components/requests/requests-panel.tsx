'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Inbox,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { NewRequestModal } from '@/components/requests/new-request-modal';
import { RequestDetailDrawer } from '@/components/requests/request-detail-drawer';
import { getRequests, createRequest, approveRequest, rejectRequest } from '@/lib/api/requests';
import { formatDop } from '@/lib/currency';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from '@/lib/page-entry-animation';
import type { LoanRequestItem, CreateRequestDto } from '@inversiones/shared';
import { Badge } from '@/components/ui/badge';
import { Card as PanelCard } from '@/components/ui/card';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;

  return (
    <Badge className="px-3 py-1.5" status={label}>
      {label}
    </Badge>
  );
}

function getAmountClassName(status: string) {
  if (status === 'APPROVED') return 'text-[var(--primary-accent)]';
  if (status === 'REJECTED') return 'text-[var(--text-secondary)]';
  return 'text-[var(--text-primary)]';
}

function EmptyPendingState({ onCreate }: { onCreate: () => void }) {
  return (
    <PanelCard className="mb-5">
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-accent)]">
          <Inbox className="h-6 w-6" />
          <CheckCircle2 className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-card text-[var(--primary-accent)]" />
        </div>
        <h2 className="mt-4 text-[15px] font-bold leading-tight text-[var(--text-primary)]">
          Todo al día
        </h2>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Las nuevas solicitudes de préstamo aparecerán aquí
        </p>
        <button
          className="mt-5 flex h-11 items-center gap-2 rounded-full border border-[var(--primary-border)] bg-card px-5 text-sm font-bold text-[var(--text-secondary)] transition-colors duration-150 hover:bg-surface-subtle hover:text-[var(--text-primary)] active:scale-[0.98]"
          onClick={onCreate}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>
    </PanelCard>
  );
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

export function RequestsPanel() {
  const [requests, setRequests] = useState<LoanRequestItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequestItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    getRequests().then(setRequests);
  }, []);

  function refresh() {
    getRequests().then(setRequests);
    setSelectedRequest(null);
  }

  const pending = requests
    .filter((r) => r.status === 'PENDING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const history = requests
    .filter((r) => r.status !== 'PENDING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleCreate(dto: CreateRequestDto) {
    try {
      await createRequest(dto);
      refresh();
      setModalOpen(false);
    } catch {
      /* silent */
    }
  }

  const total = requests.length;
  const pendingCount = pending.length;
  const approved = requests.filter((r) => r.status === 'APPROVED').length;
  const rejected = requests.filter((r) => r.status === 'REJECTED').length;

  const stats = [
    { label: 'TOTAL', value: String(total), icon: Inbox, bg: 'var(--primary-soft)', color: 'var(--primary)' },
    { label: 'PENDIENTES', value: String(pendingCount), icon: Clock3, bg: '#fff4c8', color: '#7a5a0a' },
    { label: 'APROBADAS', value: String(approved), icon: CheckCircle2, bg: '#e7f4ec', color: 'var(--primary-accent)' },
    { label: 'RECHAZADAS', value: String(rejected), icon: XCircle, bg: '#ffe8d8', color: '#9f3f25' },
  ];

  return (
    <div className="min-h-screen bg-page p-5 font-sans text-[var(--text-primary)]">
      <header
        className={`${pageEntryHeaderClassName} mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end`}
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary-accent)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary-accent)]" />
            Bandeja de entrada
          </span>
          <h1 className="mt-3 text-[28px] font-bold leading-tight text-[var(--text-primary)]">Solicitudes</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Revisa, aprueba o rechaza las solicitudes de préstamo entrantes.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-[var(--primary-accent)] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] active:scale-[0.98]"
          onClick={() => setModalOpen(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PanelCard key={stat.label} className={`${pageEntryStatCardClassName(index)} min-h-[124px] p-5`}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: stat.bg, color: stat.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{stat.label}</p>
              <p className="mt-2 text-[24px] font-bold leading-none text-[var(--text-primary)]">{stat.value}</p>
            </PanelCard>
          );
        })}
      </div>

      <div className={pageEntryTableClassName}>
        <PanelCard className="mb-5 p-3.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex h-10 flex-1 items-center gap-3 rounded-full border border-[var(--primary-border)] bg-surface-subtle px-4 text-[var(--text-secondary)] xl:max-w-[380px]">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">Buscar por nombre o cédula...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{pendingCount}</span>
              {pendingCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
            </div>
          </div>
        </PanelCard>

        {pending.length === 0 ? (
          <EmptyPendingState onCreate={() => setModalOpen(true)} />
        ) : (
          <div className="mb-5 space-y-3.5">
            {pending.map((request) => (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="flex min-h-[86px] cursor-pointer flex-col items-stretch gap-4 rounded-[18px] border border-[var(--border-soft)] bg-card px-5 py-4 shadow-[0_7px_22px_rgba(40,92,67,0.03)] transition-colors duration-150 hover:bg-surface-subtle hover:shadow-[0_14px_32px_rgba(40,92,67,0.075)] sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary-accent)]">
                    {request.firstName[0]}{request.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-[var(--text-primary)]">{request.firstName} {request.lastName}</h2>
                      <span className="text-[var(--text-secondary)]">·</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{request.code}</span>
                    </div>
                    <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[var(--text-secondary)]">{request.description}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-[var(--text-secondary)]">{timeAgo(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full shrink-0 items-center justify-between gap-5 border-t border-[var(--border-soft)] pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                  <p className={`text-base font-bold ${getAmountClassName(request.status)}`}>{formatDop(request.amount)}</p>
                  <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
              </article>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border-soft bg-surface-subtle">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-elevated"
              type="button"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Historial ({history.length})</span>
              </div>
              <ChevronRight className={`h-4 w-4 text-[var(--text-secondary)] transition-transform duration-150 ${historyOpen ? 'rotate-90' : ''}`} />
            </button>
            {historyOpen && (
              <div className="space-y-3.5 border-t border-[var(--border-soft)] p-5 pt-4">
                {history.map((request) => (
                  <article
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className="flex min-h-[86px] cursor-pointer flex-col items-stretch gap-4 rounded-[18px] border border-[var(--border-soft)] bg-card px-5 py-4 shadow-[0_7px_22px_rgba(40,92,67,0.03)] transition-colors duration-150 hover:bg-surface-subtle hover:shadow-[0_14px_32px_rgba(40,92,67,0.075)] sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-state-neutral-bg text-sm font-bold text-[var(--text-secondary)]">
                        {request.firstName[0]}{request.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-[var(--text-primary)]">{request.firstName} {request.lastName}</h2>
                          <span className="text-[var(--text-secondary)]">·</span>
                          <span className="text-xs font-medium text-[var(--text-secondary)]">{request.code}</span>
                        </div>
                        <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[var(--text-secondary)]">{request.description}</p>
                        <div className="mt-2 flex items-center gap-2.5">
                          <StatusBadge status={request.status} />
                          <span className="text-xs text-[var(--text-secondary)]">{timeAgo(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-5 border-t border-[var(--border-soft)] pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                      <p className={`text-base font-bold ${getAmountClassName(request.status)}`}>{formatDop(request.amount)}</p>
                      <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NewRequestModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      <RequestDetailDrawer
        isOpen={Boolean(selectedRequest)}
        onApprove={async () => { if (selectedRequest) { await approveRequest(selectedRequest.id); refresh(); } }}
        onClose={() => setSelectedRequest(null)}
        onReject={async () => { if (selectedRequest) { await rejectRequest(selectedRequest.id); refresh(); } }}
        request={selectedRequest}
      />
    </div>
  );
}
