'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Phone,
  Printer,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formatDop } from '@/lib/currency';
import type { LoanRequestItem } from '@inversiones/shared';

interface RequestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request?: LoanRequestItem | null;
  onApprove?: () => void;
  onReject?: () => void;
}

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pendiente', bg: '#FFF4C8', text: '#B89A22', dot: '#E2C64F' },
  UNDER_REVIEW: { label: 'En revisión', bg: '#E4F0FF', text: '#5C82B7', dot: '#6EA8E8' },
  APPROVED: { label: 'Aprobada', bg: '#E7F4EC', text: '#2F7654', dot: '#5FA37D' },
  REJECTED: { label: 'Rechazada', bg: '#FFE8D8', text: '#C96F4A', dot: '#E6A07A' },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusMap[status] ?? { label: status, bg: '#F3FAF6', text: '#5C6D63', dot: '#A9CDBB' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
      {style.label}
    </span>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white p-3.5 transition hover:-translate-y-0.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F4EC] text-[#5FA37D]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A9CDBB]">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#173D2C]">{value}</p>
      </div>
    </div>
  );
}

export function RequestDetailDrawer({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: RequestDetailDrawerProps) {
  const data = request;

  return (
    <AnimatePresence>
      {isOpen && data && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/65"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.aside
            animate={{ x: 0 }}
            className="drawer-scroll ml-auto flex h-screen w-full max-w-[540px] flex-col overflow-y-auto border-l border-[#DDEBE3] bg-[#F4FAF6] shadow-[-24px_0_60px_rgba(0,0,0,0.22)]"
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#DDEBE3] bg-white px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F4EC] text-sm font-bold text-[#5FA37D]">
                  {data.firstName[0]}{data.lastName[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#7E9086]">{data.code}</p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-[#173D2C]">{data.firstName} {data.lastName}</h2>
                  <div className="mt-2">
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>
              <button
                aria-label="Cerrar detalle"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DDEBE3] bg-white text-[#4B5750] transition hover:bg-[#F3FAF6] hover:text-[#173D2C]"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 pb-32">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[20px] border border-[#B8DCC5] bg-[#EEF8F1] p-5"
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.08 }}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#6F8076]">MONTO SOLICITADO</p>
                <p className="mt-3 text-[30px] font-bold leading-none text-[#173D2C]">
                  {formatDop(data.amount)}
                </p>
                <p className="mt-3 text-sm text-[#6F8076]">
                  Recibido el {new Date(data.createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </motion.div>

              <section className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7E9086]">DATOS DEL SOLICITANTE</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard icon={CreditCard} label="CÉDULA" value={data.identification ?? '—'} />
                  <InfoCard icon={Phone} label="TELÉFONO" value={data.phone ?? '—'} />
                  <InfoCard icon={User} label="REFERENTE" value={data.reference ?? '—'} />
                  <InfoCard icon={Calendar} label="FECHA" value={new Date(data.createdAt).toLocaleDateString('es-DO')} />
                </div>
              </section>

              {data.description && (
                <section className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-[#7E9086]">
                    <FileText className="h-4 w-4" />
                    DESCRIPCIÓN
                  </h3>
                  <div className="rounded-[16px] bg-white p-4 text-sm leading-relaxed text-[#173D2C]">
                    {data.description}
                  </div>
                </section>
              )}

              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-[#7E9086]">
                  <ImageIcon className="h-4 w-4" />
                  FOTOGRAFÍAS
                </h3>
                <div className="flex h-[118px] w-[155px] items-center justify-center rounded-[14px] bg-[#EEF8F1] text-xs text-[#A9CDBB]">
                  Sin fotos
                </div>
              </section>
            </div>

            {data.status === 'PENDING' && (
              <div className="fixed bottom-0 right-0 w-full max-w-[540px] border-t border-[#DDEBE3] bg-white px-6 py-4">
                <button
                  className="mb-3 flex h-10 w-full items-center justify-center gap-2.5 rounded-full border border-[#DDEBE3] bg-white text-sm font-bold text-[#173D2C] transition hover:bg-[#F3FAF6]"
                  type="button"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir solicitud
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full border border-[#F7D6BD] bg-white text-sm font-bold text-[#C96F4A] transition hover:bg-[#FFF7EF]"
                    onClick={onReject}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full bg-[#285C43] text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:bg-[#1F4734]"
                    onClick={onApprove}
                    type="button"
                  >
                    <Check className="h-4 w-4" />
                    Aprobar solicitud
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
