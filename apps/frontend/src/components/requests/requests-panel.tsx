'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  History,
  Inbox,
  List,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { NewRequestModal } from '@/components/requests/new-request-modal';
import { RequestDetailDrawer, type RequestDetail } from '@/components/requests/request-detail-drawer';

const stats = [
  { label: 'TOTAL', value: '6', icon: Inbox, bg: '#B8DCC5', color: '#285C43' },
  { label: 'PENDIENTES', value: '2', icon: Clock3, bg: '#FFF4C8', color: '#B89A22' },
  { label: 'APROBADAS', value: '2', icon: CheckCircle2, bg: '#E4F0FF', color: '#5C82B7' },
  { label: 'RECHAZADAS', value: '1', icon: XCircle, bg: '#FFE3D2', color: '#C96F4A' },
];

const requests = [
  {
    name: 'Carmen Reyes Polanco',
    code: 'SOL-2041',
    description:
      'Solicito un préstamo para ampliar mi colmado familiar y comprar una nevera nueva. Tengo ingresos estables hace 4 años.',
    status: 'Pendiente',
    time: 'Hace 12 meses',
    amount: 'RD$85,000',
    avatar: 'https://i.pravatar.cc/96?img=32',
    identification: '402-1234567-8',
    phone: '+1 (809) 555-0142',
    reference: 'Pedro Reyes — +...',
    date: '24/5/2025',
    receivedAt: 'Recibido el 24 de mayo de 2025',
  },
  {
    name: 'Luis Martínez Cruz',
    code: 'SOL-2040',
    description:
      'Necesito capital para reparación de mi vehículo de trabajo. Soy chofer de aplicaciones desde hace 2 años.',
    status: 'En revisión',
    time: 'Hace 12 meses',
    amount: 'RD$32,000',
    avatar: 'https://i.pravatar.cc/96?img=13',
    identification: '001-9876543-2',
    phone: '+1 (829) 432-1180',
    reference: 'María Cruz (madre) — +...',
    date: '24/5/2025',
    receivedAt: 'Recibido el 24 de mayo de 2025',
  },
  {
    name: 'Yulissa Encarnación',
    code: 'SOL-2037',
    description: 'Solicito préstamo para iniciar mi negocio de comida casera por encargo. Tengo cocina equipada.',
    status: 'Pendiente',
    time: 'Hace 12 meses',
    amount: 'RD$25,000',
    avatar: 'https://i.pravatar.cc/96?img=12',
    identification: '402-5544332-1',
    phone: '+1 (829) 555-2037',
    reference: 'Ana Encarnación — +...',
    date: '24/5/2025',
    receivedAt: 'Recibido el 24 de mayo de 2025',
  },
];

const statusStyles = {
  Pendiente: { bg: '#FFF4C8', text: '#B89A22', dot: '#E2C64F' },
  'En revisión': { bg: '#E4F0FF', text: '#5C82B7', dot: '#6EA8E8' },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 },
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

function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
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

export function RequestsPanel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);

  return (
    <div className="min-h-screen bg-[#F6FAF7] p-5 font-sans text-[#173D2C]">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#5FA37D]">
            <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
            Bandeja de entrada
          </span>
          <h1 className="mt-3 text-[28px] font-bold leading-tight text-[#173D2C]">Solicitudes</h1>
          <p className="mt-1.5 text-sm text-[#7E9086]">
            Revisa, aprueba o rechaza las solicitudes de préstamo entrantes.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:-translate-y-0.5"
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
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px]"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8CA096]">{stat.label}</p>
              <p className="mt-2 text-[24px] font-bold leading-none text-[#173D2C]">{stat.value}</p>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard className="mb-5 p-3.5" index={5}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <button className="flex h-10 items-center gap-2 rounded-[14px] bg-[#E7F4EC] px-3.5 text-sm font-bold text-[#173D2C] shadow-[0_8px_18px_rgba(40,92,67,0.05)] transition hover:-translate-y-0.5">
              <Inbox className="h-4 w-4 text-[#5FA37D]" />
              Activas
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-[#A9CDBB] bg-white px-1.5 text-xs text-[#5FA37D]">
                3
              </span>
            </button>
            <button className="flex h-10 items-center gap-2 rounded-[14px] px-3.5 text-sm font-bold text-[#5C6D63] transition hover:bg-[#F3FAF6]">
              <History className="h-4 w-4 text-[#8CA096]" />
              Historial
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-[#DDEBE3] bg-white px-1.5 text-xs text-[#8CA096]">
                3
              </span>
            </button>
          </div>

          <div className="flex h-10 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-4 text-[#A9CDBB] xl:ml-auto xl:max-w-[380px]">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">Buscar por nombre o cédula...</span>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:w-[330px]">
            {['Todas', 'Más recientes'].map((label) => (
              <button
                key={label}
                className="flex h-10 items-center justify-between rounded-full border border-[#DDEBE3] bg-white px-4 text-sm font-semibold text-[#173D2C] shadow-sm transition hover:bg-[#F3FAF6]"
              >
                {label}
                <ChevronDown className="h-4 w-4 text-[#A9CDBB]" />
              </button>
            ))}
          </div>
        </div>
      </PanelCard>

      <div className="space-y-3.5">
        {requests.map((request, index) => (
          <motion.article
            key={request.code}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={index + 6}
            onClick={() => setSelectedRequest(request)}
            whileHover={{ y: -3 }}
            className="flex min-h-[86px] cursor-pointer items-center gap-4 rounded-[18px] border border-[#EDF2EF] bg-white px-5 py-4 shadow-[0_7px_22px_rgba(40,92,67,0.03)] transition-shadow hover:shadow-[0_14px_32px_rgba(40,92,67,0.075)]"
          >
            <div className="h-11 w-11 shrink-0 rounded-full bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]" style={{ backgroundImage: `url(${request.avatar})` }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#173D2C]">{request.name}</h2>
                <span className="text-[#A9CDBB]">·</span>
                <span className="text-xs font-medium text-[#8CA096]">{request.code}</span>
              </div>
              <p className="mt-1.5 max-w-[920px] truncate text-xs font-medium text-[#7E9086]">{request.description}</p>
              <div className="mt-2 flex items-center gap-2.5">
                <StatusBadge status={request.status as keyof typeof statusStyles} />
                <span className="text-xs text-[#A9CDBB]">{request.time}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <p className="text-base font-bold text-[#173D2C]">{request.amount}</p>
              <ChevronRight className="h-4 w-4 text-[#A9CDBB]" />
            </div>
          </motion.article>
        ))}
      </div>

      <button className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_12px_24px_rgba(255,106,0,0.28)]">
        <List className="h-6 w-6" strokeWidth={3} />
      </button>

      <NewRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <RequestDetailDrawer
        isOpen={Boolean(selectedRequest)}
        onApprove={() => setSelectedRequest(null)}
        onClose={() => setSelectedRequest(null)}
        onReject={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
