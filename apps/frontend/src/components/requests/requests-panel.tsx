'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
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
import { getStaggerDelay } from '@/lib/animation';
import { formatDop } from '@/lib/currency';
import type { LoanRequestItem, CreateRequestDto } from '@inversiones/shared';

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pendiente', bg: '#FFF4C8', text: '#B89A22', dot: '#E2C64F' },
  UNDER_REVIEW: { label: 'En revisión', bg: '#E4F0FF', text: '#2F5F91', dot: '#6EA8E8' },
  APPROVED: { label: 'Aprobada', bg: '#E7F4EC', text: '#2F7654', dot: '#2F7654' },
  REJECTED: { label: 'Rechazada', bg: '#FFE8D8', text: '#9F3F25', dot: '#E6A07A' },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.06) },
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

function StatusBadge({ status }: { status: string }) {
  const style = statusMap[status] ?? { label: status, bg: '#F3FAF6', text: '#5C6D63', dot: '#5C6D63' };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {style.label}
    </span>
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
    { label: 'TOTAL', value: String(total), icon: Inbox, bg: '#B8DCC5', color: '#285C43' },
    { label: 'PENDIENTES', value: String(pendingCount), icon: Clock3, bg: '#FFF4C8', color: '#B89A22' },
    { label: 'APROBADAS', value: String(approved), icon: CheckCircle2, bg: '#E4F0FF', color: '#2F5F91' },
    { label: 'RECHAZADAS', value: String(rejected), icon: XCircle, bg: '#FFE3D2', color: '#9F3F25' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#2F7654]">
            <span className="h-2 w-2 rounded-full bg-[#2F7654]" />
            Bandeja de entrada
          </span>
          <h1 className="mt-3 text-[28px] font-bold leading-tight text-[#173D2C]">Solicitudes</h1>
          <p className="mt-1.5 text-sm text-[#5C6D63]">
            Revisa, aprueba o rechaza las solicitudes de préstamo entrantes.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-[#2f7654] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5"
          onClick={() => setModalOpen(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </motion.header>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PanelCard key={stat.label} className="min-h-[124px] p-5" index={index + 1}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: stat.bg, color: stat.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#5C6D63]">{stat.label}</p>
              <p className="mt-2 text-[24px] font-bold leading-none text-[#173D2C]">{stat.value}</p>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard className="mb-5 p-3.5" index={5}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex h-10 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-4 text-[#5C6D63] xl:max-w-[380px]">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">Buscar por nombre o cédula...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5C6D63]">
            <span className="font-semibold text-[#173D2C]">{pendingCount}</span>
            {pendingCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
          </div>
        </div>
      </PanelCard>

      {pending.length === 0 ? (
        <p className="py-12 text-center text-sm font-medium text-[#5C6D63]">No hay solicitudes pendientes</p>
      ) : (
        <div className="mb-5 space-y-3.5">
          {pending.map((request, index) => (
            <motion.article
              key={request.id}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index + 6}
              onClick={() => setSelectedRequest(request)}
              whileHover={{ y: -3 }}
              className="flex min-h-[86px] cursor-pointer items-center gap-4 rounded-[18px] border border-[#EDF2EF] bg-white px-5 py-4 shadow-[0_7px_22px_rgba(40,92,67,0.03)] transition-shadow hover:shadow-[0_14px_32px_rgba(40,92,67,0.075)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F4EC] text-sm font-bold text-[#2F7654]">
                {request.firstName[0]}{request.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-[#173D2C]">{request.firstName} {request.lastName}</h2>
                  <span className="text-[#5C6D63]">·</span>
                  <span className="text-xs font-medium text-[#5C6D63]">{request.code}</span>
                </div>
                <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[#5C6D63]">{request.description}</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <StatusBadge status={request.status} />
                  <span className="text-xs text-[#5C6D63]">{timeAgo(request.createdAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <p className="text-base font-bold text-[#173D2C]">{formatDop(request.amount)}</p>
                <ChevronRight className="h-4 w-4 text-[#5C6D63]" />
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            type="button"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#5C6D63]" />
              <span className="text-sm font-bold text-[#173D2C]">Historial</span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-[#5C6D63] bg-white px-1.5 text-xs text-[#2F7654]">
                {history.length}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 text-[#5C6D63] transition-transform ${historyOpen ? 'rotate-90' : ''}`} />
          </button>
          {historyOpen && (
            <div className="space-y-3.5 border-t border-[#EDF2EF] p-5 pt-4">
              {history.map((request) => (
                <article
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="flex min-h-[86px] cursor-pointer items-center gap-4 rounded-[18px] border border-[#EDF2EF] bg-[#F6F7F9] px-5 py-4 shadow-[0_7px_22px_rgba(40,92,67,0.03)] transition-shadow hover:shadow-[0_14px_32px_rgba(40,92,67,0.075)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8EAED] text-sm font-bold text-[#5C6D63]">
                    {request.firstName[0]}{request.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-[#173D2C]">{request.firstName} {request.lastName}</h2>
                      <span className="text-[#5C6D63]">·</span>
                      <span className="text-xs font-medium text-[#5C6D63]">{request.code}</span>
                    </div>
                    <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[#5C6D63]">{request.description}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-[#5C6D63]">{timeAgo(request.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-5">
                    <p className="text-base font-bold text-[#173D2C]">{formatDop(request.amount)}</p>
                    <ChevronRight className="h-4 w-4 text-[#5C6D63]" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

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
