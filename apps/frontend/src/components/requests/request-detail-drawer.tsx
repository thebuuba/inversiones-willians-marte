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

export interface RequestDetail {
  name: string;
  code: string;
  description: string;
  status: string;
  amount: string;
  avatar: string;
  identification?: string;
  phone?: string;
  reference?: string;
  date?: string;
  receivedAt?: string;
  photo?: string;
}

interface RequestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request?: RequestDetail | null;
  onApprove?: () => void;
  onReject?: () => void;
}

const fallbackRequest: RequestDetail = {
  name: 'Luis Martínez Cruz',
  code: 'SOL-2040',
  description:
    'Necesito capital para reparación de mi vehículo de trabajo. Soy chofer de aplicaciones desde hace 2 años.',
  status: 'En revisión',
  amount: 'RD$32,000',
  avatar: 'https://i.pravatar.cc/96?img=13',
  identification: '001-9876543-2',
  phone: '+1 (829) 432-1180',
  reference: 'María Cruz (madre) — +...',
  date: '24/5/2025',
  receivedAt: 'Recibido el 24 de mayo de 2025',
  photo: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=500&q=80',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8E9FF] px-3 py-1 text-xs font-bold text-[#3F7FBD]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#3F7FBD]" />
      {status}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white p-3.5 transition hover:-translate-y-0.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F4EC] text-[#5FA37D]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A9CDBB]">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#285C43]">{value}</p>
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
  const data = request ?? fallbackRequest;

  return (
    <AnimatePresence>
      {isOpen && (
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
                <div
                  className="h-12 w-12 rounded-full border-[3px] border-[#B8DCC5] bg-cover bg-center shadow-[0_8px_20px_rgba(40,92,67,0.12)]"
                  style={{ backgroundImage: `url(${data.avatar})` }}
                />
                <div>
                  <p className="text-xs font-bold text-[#7E9086]">{data.code}</p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-[#285C43]">{data.name}</h2>
                  <div className="mt-2">
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>
              <button
                aria-label="Cerrar detalle"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DDEBE3] bg-white text-[#4B5750] transition hover:bg-[#F3FAF6] hover:text-[#285C43]"
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
                <p className="mt-3 text-[30px] font-bold leading-none text-[#285C43]">{data.amount}</p>
                <p className="mt-3 text-sm text-[#6F8076]">{data.receivedAt}</p>
              </motion.div>

              <section className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7E9086]">
                  DATOS DEL SOLICITANTE
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard icon={CreditCard} label="CÉDULA" value={data.identification ?? '001-9876543-2'} />
                  <InfoCard icon={Phone} label="TELÉFONO" value={data.phone ?? '+1 (829) 432-1180'} />
                  <InfoCard icon={User} label="REFERENTE" value={data.reference ?? 'María Cruz (madre) — +...'} />
                  <InfoCard icon={Calendar} label="FECHA" value={data.date ?? '24/5/2025'} />
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-[#7E9086]">
                  <FileText className="h-4 w-4" />
                  DESCRIPCIÓN
                </h3>
                <div className="rounded-[16px] bg-white p-4 text-sm leading-relaxed text-[#285C43]">
                  {data.description}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-[#7E9086]">
                  <ImageIcon className="h-4 w-4" />
                  FOTOGRAFÍAS (1)
                </h3>
                <div
                  className="h-[118px] w-[155px] rounded-[14px] bg-cover bg-center shadow-[0_8px_20px_rgba(40,92,67,0.12)]"
                  style={{ backgroundImage: `url(${data.photo ?? fallbackRequest.photo})` }}
                />
              </section>
            </div>

            <div className="fixed bottom-0 right-0 w-full max-w-[540px] border-t border-[#DDEBE3] bg-white px-6 py-4">
              <button className="mb-3 flex h-10 w-full items-center justify-center gap-2.5 rounded-full border border-[#DDEBE3] bg-white text-sm font-bold text-[#285C43] transition hover:bg-[#F3FAF6]" type="button">
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
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
