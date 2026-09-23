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
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  approveRequest,
  rejectRequest,
  addRequestPhoto,
} from '@/lib/api/requests';
import { requestName, requestInitials, requestAmount } from '@/lib/request-display';
import { useAuth } from '@/lib/auth-context';
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
        <h2 className="mt-4 text-base font-bold leading-tight text-[var(--text-primary)]">
          Todo al día
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
  const { user } = useAuth();
  const [requests, setRequests] = useState<LoanRequestItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LoanRequestItem | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequestItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .catch(() => setError('No se pudieron cargar las solicitudes.'))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    try {
      setRequests(await getRequests());
      setError('');
    } catch {
      setError('No se pudieron actualizar las solicitudes.');
    }
    setSelectedRequest(null);
  }

  const query = search.trim().toLocaleLowerCase('es');
  const matches = (request: LoanRequestItem) =>
    !query ||
    [request.firstName, request.lastName, request.identification, request.code].some((value) =>
      value?.toLocaleLowerCase('es').includes(query),
    );
  const pending = requests
    .filter((r) => r.status === 'PENDING')
    .filter(matches)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const history = requests
    .filter((r) => r.status !== 'PENDING')
    .filter(matches)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleCreate(dto: CreateRequestDto, photos: File[]) {
    const created = await createRequest(dto);
    const uploads = await Promise.allSettled(
      photos.map((photo) => addRequestPhoto(created.id, photo)),
    );
    const failed = uploads.filter((result) => result.status === 'rejected').length;
    await refresh();
    setModalOpen(false);
    if (failed) {
      setError(
        `La solicitud se creó, pero ${failed} foto${failed === 1 ? '' : 's'} no se pudo subir.`,
      );
    }
  }

  async function handleEdit(dto: CreateRequestDto, photos: File[]) {
    if (!editingRequest) return;
    const id = editingRequest.id;
    await updateRequest(id, dto);
    const uploads = await Promise.allSettled(photos.map((photo) => addRequestPhoto(id, photo)));
    const updated = await getRequest(id);
    setRequests((current) => current.map((request) => (request.id === id ? updated : request)));
    setSelectedRequest(updated);
    setEditingRequest(null);
    setModalOpen(false);
    const failed = uploads.filter((result) => result.status === 'rejected').length;
    setError(
      failed
        ? `Los cambios se guardaron, pero ${failed} foto${failed === 1 ? '' : 's'} no se pudo subir.`
        : '',
    );
  }

  function openCreate() {
    setEditingRequest(null);
    setFormVersion((value) => value + 1);
    setModalOpen(true);
  }

  function openEdit(request: LoanRequestItem) {
    setEditingRequest(request);
    setFormVersion((value) => value + 1);
    setModalOpen(true);
  }

  async function changeStatus(action: 'approve' | 'reject') {
    if (!selectedRequest || busy) return;
    setBusy(true);
    try {
      if (action === 'approve') await approveRequest(selectedRequest.id);
      else await rejectRequest(selectedRequest.id);
      await refresh();
    } catch {
      setError('No se pudo cambiar el estado de la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddPhoto(file: File) {
    if (!selectedRequest) return;
    const id = selectedRequest.id;
    await addRequestPhoto(id, file);
    const updated = await getRequest(id);
    setSelectedRequest((current) => (current?.id === id ? updated : current));
    setRequests((current) =>
      current.map((request) => (request.id === updated.id ? updated : request)),
    );
  }

  const total = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approved = requests.filter((r) => r.status === 'APPROVED').length;
  const rejected = requests.filter((r) => r.status === 'REJECTED').length;

  const stats = [
    {
      label: 'TOTAL',
      value: String(total),
      icon: Inbox,
      className: 'bg-state-neutral-bg text-primary',
      surface: 'bg-[var(--card-tone-neutral)]',
    },
    {
      label: 'PENDIENTES',
      value: String(pendingCount),
      icon: Clock3,
      className: 'bg-[#26322C] text-white',
      surface: 'bg-[var(--card-tone-neutral)]',
    },
    {
      label: 'APROBADAS',
      value: String(approved),
      icon: CheckCircle2,
      className: 'bg-state-success-bg text-state-success',
      surface: 'bg-[var(--card-tone-green)]',
    },
    {
      label: 'RECHAZADAS',
      value: String(rejected),
      icon: XCircle,
      className: 'bg-state-danger-bg text-state-danger',
      surface: 'bg-[var(--card-tone-coral)]',
    },
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
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--text-primary)]">
            Solicitudes
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Revisa, aprueba o rechaza las solicitudes de préstamo entrantes.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-action transition hover:-translate-y-0.5 hover:bg-primary-hover active:scale-[0.98]"
          onClick={openCreate}
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
            <PanelCard
              key={stat.label}
              className={`${pageEntryStatCardClassName(index)} min-h-[124px] p-5 ${stat.surface}`}
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-control ${stat.className}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold leading-none text-[var(--text-primary)]">
                {stat.value}
              </p>
            </PanelCard>
          );
        })}
      </div>

      <div className={pageEntryTableClassName}>
        <PanelCard className="mb-5 p-3.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex h-10 flex-1 items-center gap-3 rounded-full border border-[var(--primary-border)] bg-surface-subtle px-4 text-[var(--text-secondary)] xl:max-w-[380px]">
              <Search className="h-4 w-4 shrink-0" />
              <input
                aria-label="Buscar solicitudes"
                className="w-full bg-transparent text-sm outline-none placeholder:text-text-secondary"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{pendingCount}</span>
              {pendingCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
            </div>
          </div>
        </PanelCard>

        {error && (
          <p role="alert" className="mb-4 text-sm text-state-danger">
            {error}
          </p>
        )}
        {loading && <p className="mb-4 text-sm text-text-secondary">Cargando solicitudes...</p>}

        {!loading && pending.length === 0 && !query && !error ? (
          <EmptyPendingState onCreate={openCreate} />
        ) : pending.length === 0 && query && history.length === 0 ? (
          <p className="mb-5 text-sm text-text-secondary">
            No hay solicitudes pendientes que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="mb-5 space-y-3.5">
            {pending.map((request) => (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedRequest(request);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Ver solicitud ${request.code} de ${requestName(request)}`}
                className="flex min-h-[86px] cursor-pointer flex-col items-stretch gap-4 rounded-panel border border-border-soft bg-card px-5 py-4 shadow-soft transition-colors duration-150 hover:bg-surface-subtle hover:shadow-soft focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-accent">
                    {requestInitials(request)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-text-primary">
                        {requestName(request)}
                      </h2>
                      <span className="text-text-secondary">·</span>
                      <span className="text-xs font-medium text-text-secondary">
                        {request.code}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-text-secondary">
                      {request.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-text-secondary">
                        {timeAgo(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full shrink-0 items-center justify-between gap-5 border-t border-border-soft pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                  <p className={`text-base font-bold ${getAmountClassName(request.status)}`}>
                    {requestAmount(request)}
                  </p>
                  <ChevronRight className="h-4 w-4 text-text-secondary" />
                </div>
              </article>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="overflow-hidden rounded-control-comfortable border border-border-soft bg-surface-subtle">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-elevated"
              type="button"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-text-secondary" />
                <span className="text-sm font-bold text-text-primary">
                  Historial ({history.length})
                </span>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-text-secondary transition-transform duration-150 ${historyOpen ? 'rotate-90' : ''}`}
              />
            </button>
            {historyOpen && (
              <div className="space-y-3.5 border-t border-border-soft p-5 pt-4">
                {history.map((request) => (
                  <article
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRequest(request);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver solicitud ${request.code} de ${requestName(request)}`}
                    className="flex min-h-[86px] cursor-pointer flex-col items-stretch gap-4 rounded-panel border border-border-soft bg-card px-5 py-4 shadow-soft transition-colors duration-150 hover:bg-surface-subtle hover:shadow-soft focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-state-neutral-bg text-sm font-bold text-[var(--text-secondary)]">
                        {requestInitials(request)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            {requestName(request)}
                          </h2>
                          <span className="text-[var(--text-secondary)]">·</span>
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {request.code}
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[var(--text-secondary)]">
                          {request.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2.5">
                          <StatusBadge status={request.status} />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {timeAgo(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-5 border-t border-[var(--border-soft)] pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                      <p className={`text-base font-bold ${getAmountClassName(request.status)}`}>
                        {requestAmount(request)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NewRequestModal
        key={`${editingRequest?.id ?? 'new'}-${formVersion}`}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRequest(null);
        }}
        onSubmit={editingRequest ? handleEdit : handleCreate}
        request={editingRequest}
      />
      <RequestDetailDrawer
        isOpen={Boolean(selectedRequest)}
        onApprove={() => {
          void changeStatus('approve');
        }}
        onClose={() => setSelectedRequest(null)}
        onReject={() => {
          void changeStatus('reject');
        }}
        onAddPhoto={handleAddPhoto}
        onEdit={openEdit}
        canDecide={user?.role === 'ADMIN' || user?.role === 'COLLECTOR'}
        busy={busy}
        request={selectedRequest}
      />
    </div>
  );
}
