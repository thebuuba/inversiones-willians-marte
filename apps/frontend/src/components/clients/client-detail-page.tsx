'use client';

import Link from 'next/link';
import { useEffect, type ReactNode, useState } from 'react';
import { getClient } from '@/lib/api/clients';
import type { ClientDetail, LoanSummary } from '@inversiones/shared';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  History,
  Image,
  Check,
  Plus,
  Mail,
  MapPin,
  NotebookPen,
  Pencil,
  StickyNote,
  TrendingUp,
  Trash2,
  Upload,
  X,
  UserRound,
  Phone,
} from 'lucide-react';

type ClientTab = 'Información' | 'Préstamos' | 'Documentos' | 'Historial' | 'Notas';

const tabs: { label: ClientTab; icon: typeof UserRound; count?: number }[] = [
  { label: 'Información', icon: UserRound },
  { label: 'Préstamos', icon: TrendingUp },
  { label: 'Documentos', icon: FileText },
  { label: 'Historial', icon: History },
  { label: 'Notas', icon: StickyNote },
];

function buildInfoCards(clientData: ClientDetail) {
  const fmt = new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' });
  return [
    { label: 'CÉDULA', value: clientData.identification ?? '—', icon: CreditCard },
    { label: 'TELÉFONO', value: clientData.phone ?? '—', icon: Phone },
    { label: 'TELÉFONO ALT.', value: clientData.altPhone ?? '—', icon: Phone },
    { label: 'CORREO ELECTRÓNICO', value: clientData.email ?? '—', icon: Mail },
    { label: 'DIRECCIÓN', value: clientData.address ?? '—', icon: Building2 },
    { label: 'GÉNERO', value: clientData.gender ?? '—', icon: UserRound },
    { label: 'ESTADO CIVIL', value: clientData.maritalStatus ?? '—', icon: UserRound },
    { label: 'NACIONALIDAD', value: clientData.nationality ?? '—', icon: MapPin },
    { label: 'FECHA DE NACIMIENTO', value: clientData.birthDate ? fmt.format(new Date(clientData.birthDate)) : '—', icon: CalendarDays },
    { label: 'DEPENDIENTES', value: clientData.dependents != null ? String(clientData.dependents) : '—', icon: UserRound },
    { label: 'CLIENTE DESDE', value: fmt.format(new Date(clientData.createdAt)), icon: CalendarDays },
    { label: 'NOTAS', value: clientData.notes ?? '—', icon: StickyNote },
  ];
}

interface ClientDocument {
  title: string;
  category: string;
  size: string;
  date: string;
  tone: 'green' | 'blue' | 'yellow' | 'purple';
  icon: typeof CreditCard;
}

const initialDocuments: ClientDocument[] = [
  {
    title: 'Cédula de identidad',
    category: 'Cédula',
    size: '1.2 MB',
    date: '10/1/2023',
    tone: 'green',
    icon: CreditCard,
  },
  {
    title: 'Contrato préstamo PR-2104',
    category: 'Contrato',
    size: '340 KB',
    date: '15/6/2024',
    tone: 'blue',
    icon: FileText,
  },
  {
    title: 'Comprobante de ingresos',
    category: 'Comprobante',
    size: '890 KB',
    date: '14/6/2024',
    tone: 'yellow',
    icon: FileText,
  },
  {
    title: 'Foto del local comercial',
    category: 'Fotografía',
    size: '2.4 MB',
    date: '14/6/2024',
    tone: 'purple',
    icon: Image,
  },
];

interface HistoryEvent {
  type: string;
  amount?: string;
  title: string;
  author: string;
  date: string;
}

type ClientNote = {
  id: number;
  text: string;
  author: string;
  date: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.045 },
  }),
};

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#3E8A61]">
      <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3EF] px-3 py-1 text-xs font-bold text-[#7A8A80]">
      <span className="h-2 w-2 rounded-full bg-[#A9CDBB]" />
      Inactivo
    </span>
  );
}

function ClientHeader({ clientData }: { clientData: ClientDetail }) {
  const fullName = `${clientData.firstName} ${clientData.lastName}`;

  return (
    <motion.header animate="visible" className="mb-4" initial="hidden" variants={fadeUp}>
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#5C6D63] transition hover:text-[#173D2C]"
        href="/clientes"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="mt-5 flex items-center gap-3.5">
        {clientData.photo ? (
          <div
            aria-label={fullName}
            className="h-12 w-12 rounded-[15px] border-[3px] border-[#B8EBC9] bg-cover bg-center shadow-[0_8px_18px_rgba(40,92,67,0.1)]"
            role="img"
            style={{ backgroundImage: `url(${clientData.photo})` }}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-[15px] border-[3px] border-[#B8EBC9] bg-[#EAF6EF] shadow-[0_8px_18px_rgba(40,92,67,0.1)]">
            <UserRound className="h-6 w-6 text-[#5FA37D]" />
          </div>
        )}
        <div>
          <h1 className="text-[24px] font-bold leading-tight text-[#1F4A36]">{fullName}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-sm font-medium text-[#7A8A80]">{clientData.identification ?? '—'}</p>
            <span className="text-[#A9CDBB]">·</span>
            <StatusBadge active={clientData.active} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function ClientTabs({ activeTab, onTabChange }: { activeTab: ClientTab; onTabChange: (tab: ClientTab) => void }) {
  return (
    <motion.div animate="visible" className="mb-5" custom={1} initial="hidden" variants={fadeUp}>
      <div className="mb-3 flex justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#285C43] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1F4A36]"
          href="/prestamos/nuevo"
        >
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </Link>
      </div>

      <nav className="overflow-x-auto rounded-[16px] border border-[#DDEBE3] bg-white p-1.5 shadow-[0_7px_22px_rgba(40,92,67,0.035)]">
        <div className="flex min-w-max items-center gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.label;

            return (
              <button
                className={`flex h-10 items-center gap-2 rounded-[12px] px-3.5 text-sm font-bold transition ${
                  active ? 'bg-[#E7F4EC] text-[#173D2C] shadow-sm' : 'text-[#5C6D63] hover:bg-[#F6FAF7]'
                }`}
                key={tab.label}
                onClick={() => onTabChange(tab.label)}
                type="button"
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#173D2C]' : 'text-[#7A8A80]'}`} />
                {tab.label}
                {tab.count && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#A9CDBB] bg-white text-[11px] font-bold text-[#5FA37D]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  const isPaid = status === 'Pagado';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        isPaid ? 'bg-[#D9ECFF] text-[#3A75B8]' : 'bg-[#E7F4EC] text-[#3E8A61]'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-[#5A9AE0]' : 'bg-[#5FA37D]'}`} />
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span className="text-[#7E9086]">Progreso de pago</span>
        <span className="text-[#173D2C]">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E7F4EC]">
        <motion.div
          animate={{ width: `${value}%` }}
          className="h-full rounded-full bg-[#5FA37D]"
          initial={{ width: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function LoanMetric({ label, value, tone = 'green' }: { label: string; value: string; tone?: 'green' | 'orange' }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#A7B5AD]">{label}</p>
      <p className={`mt-1.5 text-[20px] font-bold leading-none ${tone === 'orange' ? 'text-[#B45B38]' : 'text-[#173D2C]'}`}>
        {value}
      </p>
    </div>
  );
}

function LoanCard({ loan, index }: { loan: LoanSummary; index: number }) {
  const progress = loan.principal > 0 ? Math.round(((loan.principal - loan.balance) / loan.principal) * 100) : 0;
  const fmt = new Intl.NumberFormat('es-DO');
  const statusLabel = loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID' ? 'Pagado' : loan.status === 'OVERDUE' ? 'Vencido' : loan.status;

  return (
    <motion.article
      animate="visible"
      className="rounded-[18px] border border-[#DDEBE3] bg-white p-5 shadow-[0_7px_22px_rgba(40,92,67,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(40,92,67,0.06)]"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E7F4EC] text-[#5FA37D]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight text-[#173D2C]">{loan.product?.name ?? 'Préstamo'}</h3>
            <p className="mt-1 text-sm font-medium text-[#7A8A80]">
              {loan.term} cuotas · {loan.paymentFreq === 'MONTHLY' ? 'Mensual' : loan.paymentFreq === 'DAILY' ? 'Diario' : loan.paymentFreq}
            </p>
          </div>
        </div>
        <LoanStatusBadge status={statusLabel} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <LoanMetric label="CAPITAL" value={`RD$${fmt.format(loan.principal)}`} />
        <LoanMetric label="SALDO PENDIENTE" tone="orange" value={`RD$${fmt.format(loan.balance)}`} />
        <LoanMetric label="CUOTA" value={`RD$${fmt.format(Math.round(loan.totalAmount / loan.term))}`} />
      </div>

      <ProgressBar value={progress} />

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#A7B5AD]">
        <CalendarDays className="h-4 w-4" />
        Inicio: {new Date(loan.startDate).toLocaleDateString('es-DO')}
      </div>
    </motion.article>
  );
}

function ClientLoansTab({ loans }: { loans: LoanSummary[] }) {
  return (
    <section>
      <div className="space-y-4">
        {loans.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-[#A9CDBB]">Sin préstamos registrados.</p>
        ) : (
          loans.map((loan, index) => (
            <LoanCard index={index + 2} key={loan.id} loan={loan} />
          ))
        )}
      </div>
    </section>
  );
}

function UploadDocumentButton() {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#285C43] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1F4A36]">
      <Upload className="h-4 w-4" />
      Subir documento
      <input className="hidden" type="file" />
    </label>
  );
}

function documentTone(tone: ClientDocument['tone']) {
  const styles = {
    green: {
      iconBg: '#E7F4EC',
      iconText: '#4F9B76',
      badgeBg: '#DFF1E7',
      badgeText: '#4F9B76',
    },
    blue: {
      iconBg: '#D9ECFF',
      iconText: '#3A75B8',
      badgeBg: '#D9ECFF',
      badgeText: '#3A75B8',
    },
    yellow: {
      iconBg: '#FFF4C8',
      iconText: '#A98219',
      badgeBg: '#FFF4C8',
      badgeText: '#A98219',
    },
    purple: {
      iconBg: '#E8DDF6',
      iconText: '#6F55A5',
      badgeBg: '#E8DDF6',
      badgeText: '#6F55A5',
    },
  };

  return styles[tone];
}

function DocumentBadge({ category, tone }: { category: string; tone: ClientDocument['tone'] }) {
  const style = documentTone(tone);

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold"
      style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
    >
      {category}
    </span>
  );
}

function DocumentCard({
  document,
  index,
  onDelete,
}: {
  document: ClientDocument;
  index: number;
  onDelete: () => void;
}) {
  const style = documentTone(document.tone);
  const Icon = document.icon;

  return (
    <motion.article
      animate="visible"
      className="flex min-h-[78px] items-center justify-between gap-4 rounded-[16px] border border-[#DDEBE3] bg-white p-4 shadow-[0_7px_22px_rgba(40,92,67,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(40,92,67,0.055)]"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
          style={{ backgroundColor: style.iconBg, color: style.iconText }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-[#173D2C]">{document.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs font-medium text-[#A7B5AD]">
            <DocumentBadge category={document.category} tone={document.tone} />
            <span>{document.size}</span>
            <span>{document.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[#7A8A80]">
        <button
          aria-label={`Descargar ${document.title}`}
          className="rounded-full p-1.5 transition hover:bg-[#EAF6EF] hover:text-[#173D2C]"
          type="button"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          aria-label={`Eliminar ${document.title}`}
          className="rounded-full p-1.5 transition hover:bg-[#FFE3D2] hover:text-[#B45B38]"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

function ClientDocumentsTab({ documents: docs }: { documents: ClientDocument[] }) {
  const [documents, setDocuments] = useState<ClientDocument[]>(docs);

  return (
    <section>
      <motion.div
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        custom={2}
        initial="hidden"
        variants={fadeUp}
      >
        <p className="text-sm font-medium text-[#7A8A80]">{documents.length} documentos archivados</p>
        <UploadDocumentButton />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {documents.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-[#A9CDBB] lg:col-span-2">Sin documentos adjuntos.</p>
        ) : (
          documents.map((document, index) => (
            <DocumentCard
              document={document}
              index={index + 3}
              key={document.title}
              onDelete={() => setDocuments((current) => current.filter((item) => item.title !== document.title))}
            />
          ))
        )}
      </div>
    </section>
  );
}

function historyTone(type: string) {
  const styles = {
    Pago: {
      iconBg: '#E7F4EC',
      iconText: '#4F9B76',
      badgeBg: '#DFF1E7',
      badgeText: '#4F9B76',
      icon: CreditCard,
    },
    Nota: {
      iconBg: '#FFF1C7',
      iconText: '#A98219',
      badgeBg: '#FFF1C7',
      badgeText: '#A98219',
      icon: StickyNote,
    },
    Estado: {
      iconBg: '#DCEBFF',
      iconText: '#3A75B8',
      badgeBg: '#DCEBFF',
      badgeText: '#3A75B8',
      icon: Activity,
    },
    Documento: {
      iconBg: '#DFF1E7',
      iconText: '#4F9B76',
      badgeBg: '#DFF1E7',
      badgeText: '#4F9B76',
      icon: NotebookPen,
    },
  };

  return styles[type as keyof typeof styles];
}

function HistoryBadge({ type }: { type: string }) {
  const style = historyTone(type);

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold"
      style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
    >
      {type}
    </span>
  );
}

function TimelineItem({ event, index }: { event: HistoryEvent; index: number }) {
  const style = historyTone(event.type);
  const Icon = style.icon;

  return (
    <motion.div
      animate="visible"
      className="relative grid grid-cols-[30px_1fr] gap-5"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="relative flex justify-center">
        <span
          className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white shadow-[0_4px_12px_rgba(40,92,67,0.08)]"
          style={{ backgroundColor: style.iconBg, color: style.iconText }}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <article className="min-h-[88px] rounded-[16px] border border-[#EDF2EF] bg-white px-5 py-3.5 shadow-[0_7px_22px_rgba(40,92,67,0.025)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(40,92,67,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <HistoryBadge type={event.type} />
              {'amount' in event && event.amount && (
                <span className="text-sm font-bold text-[#2F7D57]">{event.amount}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-[#173D2C]">{event.title}</h3>
            <p className="mt-1 text-xs font-medium text-[#A7B5AD]">{event.author}</p>
          </div>
          <time className="shrink-0 text-xs font-medium text-[#A7B5AD]">{event.date}</time>
        </div>
      </article>
    </motion.div>
  );
}

function Timeline({ events }: { events: HistoryEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[14px] top-0 w-px bg-[#DDEBE3]" />
      <div className="space-y-6">
        {events.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-[#A9CDBB]">Sin actividad registrada.</p>
        ) : (
          events.map((event, index) => (
            <TimelineItem event={event} index={index + 2} key={`${event.type}-${event.date}-${index}`} />
          ))
        )}
      </div>
    </div>
  );
}

function ClientHistoryTab({ events }: { events: HistoryEvent[] }) {
  return (
    <section>
      <Timeline events={events} />
    </section>
  );
}

function NotesToolbar({ count, onNewNote }: { count: number; onNewNote: () => void }) {
  return (
    <motion.div
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      custom={2}
      initial="hidden"
      variants={fadeUp}
    >
      <p className="text-sm font-medium text-[#7A8A80]">{count} notas</p>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#285C43] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1F4A36]"
        onClick={onNewNote}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Nueva nota
      </button>
    </motion.div>
  );
}

function NoteIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1C7] text-[#9A7618]">
      <FileText className="h-4 w-4" />
    </span>
  );
}

function NoteActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col justify-end gap-2 sm:flex-row">
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#DDEBE3] bg-white px-4 text-sm font-bold text-[#5C6D63] transition hover:bg-[#F6FAF7]"
        onClick={onCancel}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
        Cancelar
      </button>
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#285C43] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(40,92,67,0.16)] transition hover:bg-[#1F4A36]"
        onClick={onSave}
        type="button"
      >
        <Check className="h-3.5 w-3.5" />
        Guardar
      </button>
    </div>
  );
}

function NoteTextarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <textarea
      autoFocus
      className="h-[78px] w-full resize-none rounded-[10px] border border-[#2D3430] bg-white px-4 py-3 text-sm font-medium leading-relaxed text-[#173D2C] outline-none transition placeholder:text-[#A7B5AD] focus:border-[#4F9B76] focus:ring-2 focus:ring-[#DDEBE3]"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function EditableNoteCard({
  note,
  value,
  onChange,
  onCancel,
  onSave,
  index,
}: {
  note?: ClientNote;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  index: number;
}) {
  return (
    <motion.article
      animate="visible"
      className="rounded-[16px] border border-[#B8EBC9] bg-white p-4 shadow-[0_7px_22px_rgba(40,92,67,0.035)]"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="grid grid-cols-[36px_1fr] gap-4">
        <NoteIcon />
        <div>
          <NoteTextarea onChange={onChange} placeholder="Escribe una nota..." value={value} />
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm font-medium text-[#A7B5AD]">
              {note ? `${note.author} · ${note.date}` : ''}
            </p>
            <NoteActions onCancel={onCancel} onSave={onSave} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function NoteCard({
  note,
  index,
  onEdit,
  onDelete,
}: {
  note: ClientNote;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.article
      animate="visible"
      className="flex min-h-[76px] items-center justify-between gap-4 rounded-[16px] border border-transparent bg-white p-4 shadow-[0_7px_22px_rgba(40,92,67,0.025)] transition hover:border-[#DDEBE3] hover:shadow-[0_14px_32px_rgba(40,92,67,0.045)]"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex min-w-0 items-center gap-4">
        <NoteIcon />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed text-[#173D2C]">{note.text}</p>
          <p className="mt-1.5 text-xs font-medium text-[#A7B5AD]">
            {note.author} · {note.date}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-[#7A8A80]">
        <button
          aria-label="Editar nota"
          className="rounded-full p-1.5 transition hover:bg-[#EAF6EF] hover:text-[#173D2C]"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          aria-label="Eliminar nota"
          className="rounded-full p-1.5 transition hover:bg-[#FFE3D2] hover:text-[#B45B38]"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

function NewNoteCard({
  value,
  onChange,
  onCancel,
  onSave,
}: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <EditableNoteCard
      index={20}
      onCancel={onCancel}
      onChange={onChange}
      onSave={onSave}
      value={value}
    />
  );
}

function ClientNotesTab({ initialNotes = [] }: { initialNotes?: ClientNote[] }) {
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const startCreate = () => {
    setEditingId(null);
    setEditingText('');
    setDraft('');
    setIsCreating(true);
  };

  const saveNewNote = () => {
    const text = draft.trim();
    if (!text) return;

    setNotes((current) => [
      ...current,
      {
        id: Math.max(...current.map((note) => note.id), 0) + 1,
        text,
        author: 'Willians Marte',
        date: '26 de mayo de 2026',
      },
    ]);
    setDraft('');
    setIsCreating(false);
  };

  const startEdit = (note: ClientNote) => {
    setIsCreating(false);
    setDraft('');
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const saveEdit = () => {
    const text = editingText.trim();
    if (!editingId || !text) return;

    setNotes((current) => current.map((note) => (note.id === editingId ? { ...note, text } : note)));
    setEditingId(null);
    setEditingText('');
  };

  return (
    <section>
      <NotesToolbar count={notes.length} onNewNote={startCreate} />

      <div className="space-y-3.5">
        {notes.map((note, index) =>
          editingId === note.id ? (
            <EditableNoteCard
              index={index + 3}
              key={note.id}
              note={note}
              onCancel={() => {
                setEditingId(null);
                setEditingText('');
              }}
              onChange={setEditingText}
              onSave={saveEdit}
              value={editingText}
            />
          ) : (
            <NoteCard
              index={index + 3}
              key={note.id}
              note={note}
              onDelete={() => setNotes((current) => current.filter((item) => item.id !== note.id))}
              onEdit={() => startEdit(note)}
            />
          ),
        )}

        {isCreating && (
          <NewNoteCard
            onCancel={() => {
              setIsCreating(false);
              setDraft('');
            }}
            onChange={setDraft}
            onSave={saveNewNote}
            value={draft}
          />
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7E9086]">{label}</p>
      <p className="mt-1.5 text-[22px] font-bold leading-none text-[#1F4A36]">{value}</p>
    </div>
  );
}

function ClientSummaryCard({ clientData }: { clientData: ClientDetail }) {
  const fullName = `${clientData.firstName} ${clientData.lastName}`;
  const activeLoans = clientData.loans.filter((l) => l.status === 'ACTIVE').length;
  const totalLoaned = clientData.loans.reduce((s, l) => s + l.principal, 0);
  const totalPaid = clientData.loans.reduce((s, l) => s + l.principal - l.balance, 0);

  return (
    <motion.section
      animate="visible"
      className="mb-5 rounded-[20px] border border-[#DDEBE3] bg-[#EAF6EF] p-5 shadow-[0_7px_22px_rgba(40,92,67,0.035)]"
      custom={2}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center gap-5">
          <div className="relative h-[86px] w-[86px] shrink-0">
            {clientData.photo ? (
              <div
                aria-label={fullName}
                className="h-full w-full rounded-[18px] border-4 border-white bg-cover bg-center shadow-[0_10px_22px_rgba(40,92,67,0.12)]"
                role="img"
                style={{ backgroundImage: `url(${clientData.photo})` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[18px] border-4 border-white bg-[#EAF6EF] shadow-[0_10px_22px_rgba(40,92,67,0.12)]">
                <UserRound className="h-8 w-8 text-[#5FA37D]" />
              </div>
            )}
            <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white ${clientData.active ? 'bg-[#5FA37D]' : 'bg-[#A9CDBB]'}`} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold leading-tight text-[#1F4A36]">{fullName}</h2>
            <p className="mt-1.5 text-sm font-medium text-[#7A8A80]">{clientData.identification ?? '—'}</p>
            <div className="mt-3">
              <StatusBadge active={clientData.active} />
            </div>
          </div>
        </div>

        <button
          className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          type="button"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>
      </div>

      <div className="my-5 h-px bg-[#D2E8D9]" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="PRÉSTAMOS ACTIVOS" value={String(activeLoans)} />
        <Metric label="TOTAL PRESTADO" value={`RD$${totalLoaned.toLocaleString()}`} />
        <Metric label="TOTAL PAGADO" value={`RD$${totalPaid.toLocaleString()}`} />
      </div>
    </motion.section>
  );
}

function ClientInfoCard({ label, value, icon, index }: { label: string; value: string; icon: ReactNode; index: number }) {
  return (
    <motion.article
      animate="visible"
      className="flex min-h-[62px] items-center gap-3.5 rounded-[13px] border border-[#DDEBE3] bg-white p-3.5 shadow-[0_7px_18px_rgba(40,92,67,0.03)]"
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#E7F4EC] text-[#5FA37D]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#A7B5AD]">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#1F4A36]">{value}</p>
      </div>
    </motion.article>
  );
}

function ClientInfoGrid({ clientData }: { clientData: ClientDetail }) {
  const cards = buildInfoCards(clientData);

  return (
    <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <ClientInfoCard
            icon={<Icon className="h-4 w-4" />}
            index={index + 3}
            key={card.label}
            label={card.label}
            value={card.value}
          />
        );
      })}
    </section>
  );
}

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = useState<ClientTab>('Información');
  const [clientData, setClientData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getClient(clientId)
      .then(setClientData)
      .catch(() => setClientData(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F4F6] p-5 font-sans">
        <p className="text-sm font-medium text-[#A9CDBB]">Cargando...</p>
      </main>
    );
  }

  if (!clientData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F3F4F6] p-5 font-sans">
        <p className="text-sm font-medium text-[#A9CDBB]">Cliente no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-[#5FA37D] underline" href="/clientes">Volver a clientes</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#1F4A36]">
      <div className="mx-auto max-w-[1180px]">
        <ClientHeader clientData={clientData} />
        <ClientTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'Préstamos' ? (
          <ClientLoansTab loans={clientData.loans} />
        ) : activeTab === 'Documentos' ? (
          <ClientDocumentsTab documents={[]} />
        ) : activeTab === 'Historial' ? (
          <ClientHistoryTab events={[]} />
        ) : activeTab === 'Notas' ? (
          <ClientNotesTab />
        ) : activeTab === 'Información' ? (
          <>
            <ClientSummaryCard clientData={clientData} />
            <ClientInfoGrid clientData={clientData} />
          </>
        ) : null}
      </div>
    </main>
  );
}
