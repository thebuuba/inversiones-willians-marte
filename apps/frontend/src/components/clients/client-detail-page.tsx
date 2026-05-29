'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { getClient, updateClient } from '@/lib/api/clients';
import { getDocuments, createDocument, deleteDocument } from '@/lib/api/documents';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ClientDetail, LoanSummary, DocumentItem, ApiResponse } from '@inversiones/shared';
import {
  ArrowLeft,
  Activity,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  History,
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
  CircleCheck,
  Clock,
  CircleAlert,
} from 'lucide-react';

type ClientTab = 'Información' | 'Préstamos' | 'Documentos' | 'Historial' | 'Notas';

const tabs: { label: ClientTab; icon: typeof UserRound }[] = [
  { label: 'Información', icon: UserRound },
  { label: 'Préstamos', icon: TrendingUp },
  { label: 'Documentos', icon: FileText },
  { label: 'Historial', icon: History },
  { label: 'Notas', icon: StickyNote },
];

const fmt = (n: number) => `RD$ ${n.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;
const fmtDate = (s: string | Date) => new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong = (s: string | Date) => new Date(s).toLocaleDateString('es-DO', { dateStyle: 'long' });

function buildInfoCards(clientData: ClientDetail) {
  return [
    { label: 'Cédula', value: clientData.identification ?? '—', icon: CreditCard },
    { label: 'Teléfono', value: clientData.phone ?? '—', icon: Phone },
    { label: 'Tel. alternativo', value: clientData.altPhone ?? '—', icon: Phone },
    { label: 'Correo electrónico', value: clientData.email ?? '—', icon: Mail },
    { label: 'Dirección', value: clientData.address ?? '—', icon: Building2 },
    { label: 'Género', value: clientData.gender ?? '—', icon: UserRound },
    { label: 'Estado civil', value: clientData.maritalStatus ?? '—', icon: UserRound },
    { label: 'Nacionalidad', value: clientData.nationality ?? '—', icon: MapPin },
    { label: 'Fecha de nacimiento', value: clientData.birthDate ? fmtLong(clientData.birthDate) : '—', icon: CalendarDays },
    { label: 'Dependientes', value: clientData.dependents != null ? String(clientData.dependents) : '—', icon: UserRound },
    { label: 'Cliente desde', value: fmtLong(clientData.createdAt), icon: CalendarDays },
    { label: 'Notas', value: clientData.notes ?? '—', icon: StickyNote },
  ];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

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

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf5ed] px-3 py-1 text-xs font-semibold text-[#5a9a7a]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#7fb89a]" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3EF] px-3 py-1 text-xs font-semibold text-neutral-500">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
      Inactivo
    </span>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  const isPaid = status === 'Pagado';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isPaid ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#eaf5ed] text-[#5a9a7a]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-[#3b82f6]' : 'bg-[#7fb89a]'}`} />
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span className="text-neutral-500">Progreso de pago</span>
        <span className="text-neutral-900">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F6]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7fb89a] to-[#5a9a7a]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LoanCard({ loan, index }: { loan: LoanSummary; index: number }) {
  const progress = loan.principal > 0 ? Math.round(((loan.principal - loan.balance) / loan.principal) * 100) : 0;
  const statusLabel = loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID' ? 'Pagado' : loan.status === 'OVERDUE' ? 'Vencido' : loan.status;

  return (
    <div
      className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ed] text-[#5a9a7a]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight text-neutral-900">{loan.product?.name ?? 'Préstamo'}</h3>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {loan.term} cuotas · {loan.paymentFreq === 'MONTHLY' ? 'Mensual' : loan.paymentFreq === 'DAILY' ? 'Diario' : loan.paymentFreq}
            </p>
          </div>
        </div>
        <LoanStatusBadge status={statusLabel} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Capital</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{fmt(loan.principal)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Saldo pendiente</p>
          <p className="mt-1 text-lg font-bold text-[#c2410c]">{fmt(loan.balance)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Cuota</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{fmt(Math.round(loan.totalAmount / loan.term))}</p>
        </div>
      </div>

      <ProgressBar value={progress} />

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-400">
        <CalendarDays className="h-4 w-4" />
        Inicio: {fmtDate(loan.startDate)}
      </div>
    </div>
  );
}

function ClientLoansTab({ loans }: { loans: LoanSummary[] }) {
  return (
    <div className="space-y-4">
      {loans.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">Sin préstamos registrados.</p>
      ) : (
        loans.map((loan, index) => (
          <LoanCard index={index} key={loan.id} loan={loan} />
        ))
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: DocumentItem;
  onDelete: (id: string) => void;
}) {
  const fileUrl = doc.fileUrl ? `${API_BASE}/../uploads/${doc.fileUrl}` : null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm transition hover:bg-[#eaf5ed]/30">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ed]">
          <FileText className="h-5 w-5 text-[#5a9a7a]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {doc.name}
              </a>
            ) : (
              doc.name
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="rounded-full bg-[#eaf5ed] px-2.5 py-0.5 text-xs font-semibold text-[#5a9a7a]">{doc.category}</span>
            {doc.fileSize ? <span>{(doc.fileSize / 1024).toFixed(1)} KB</span> : null}
            <span>{fmtDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-neutral-400">
        {fileUrl && (
          <a
            aria-label={`Descargar ${doc.name}`}
            className="rounded-full p-1.5 transition hover:bg-[#eaf5ed] hover:text-[#5a9a7a]"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          aria-label={`Eliminar ${doc.name}`}
          className="rounded-full p-1.5 transition hover:bg-[#fde4d4] hover:text-[#c2410c]"
          onClick={() => onDelete(doc.id)}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ClientDocumentsTab({ clientId }: { clientId: number }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocuments(clientId).then(setDocuments);
  }, [clientId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name);
      fd.append('category', 'general');
      fd.append('clientId', String(clientId));
      await createDocument(fd);
      const docs = await getDocuments(clientId);
      setDocuments(docs);
    } catch {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDelete(id: string) {
    deleteDocument(id).then(() => setDocuments((prev) => prev.filter((d) => d.id !== id)));
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-neutral-500">{documents.length} documentos archivados</p>
        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#5a9a7a] px-5 text-sm text-white hover:bg-[#4a866a]">
          <Upload className="h-4 w-4" />
          {uploading ? 'Subiendo...' : 'Subir documento'}
          <input
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            className="hidden"
            disabled={uploading}
            onChange={handleFileUpload}
            type="file"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {documents.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400 lg:col-span-2">Sin documentos adjuntos.</p>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function historyTone(type: string) {
  const styles: Record<string, { bg: string; text: string; dot: string; icon: typeof CreditCard }> = {
    Pago: { bg: '#eaf5ed', text: '#5a9a7a', dot: '#7fb89a', icon: CreditCard },
    Nota: { bg: '#fef3c7', text: '#a16207', dot: '#eab308', icon: StickyNote },
    Estado: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6', icon: Activity },
    Documento: { bg: '#eaf5ed', text: '#5a9a7a', dot: '#7fb89a', icon: NotebookPen },
  };
  return styles[type] ?? styles.Nota;
}

function TimelineItem({ event, index }: { event: HistoryEvent; index: number }) {
  const style = historyTone(event.type);
  const Icon = style.icon;

  return (
    <div className="relative grid grid-cols-[30px_1fr] gap-5">
      <div className="relative flex justify-center">
        <span
          className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white shadow-sm"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white px-5 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {event.type}
              </span>
              {event.amount && (
                <span className="text-sm font-bold text-[#5a9a7a]">{event.amount}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-neutral-900">{event.title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{event.author}</p>
          </div>
          <time className="shrink-0 text-xs text-neutral-400">{event.date}</time>
        </div>
      </div>
    </div>
  );
}

function ClientHistoryTab({ events }: { events: HistoryEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[14px] top-0 w-px bg-neutral-200" />
      <div className="space-y-6">
        {events.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">Sin actividad registrada.</p>
        ) : (
          events.map((event, index) => (
            <TimelineItem event={event} index={index} key={`${event.type}-${event.date}-${index}`} />
          ))
        )}
      </div>
    </div>
  );
}

function NoteIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7] text-[#a16207]">
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
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
        onClick={onCancel}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
        Cancelar
      </button>
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#5a9a7a] px-4 text-sm font-semibold text-white transition hover:bg-[#4a866a]"
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
      className="h-[78px] w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#5a9a7a] focus:ring-2 focus:ring-[#eaf5ed]"
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
}: {
  note?: ClientNote;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#7fb89a] bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[36px_1fr] gap-4">
        <NoteIcon />
        <div>
          <NoteTextarea onChange={onChange} placeholder="Escribe una nota..." value={value} />
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-neutral-500">
              {note ? `${note.author} · ${note.date}` : ''}
            </p>
            <NoteActions onCancel={onCancel} onSave={onSave} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: ClientNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm transition hover:bg-[#eaf5ed]/30">
      <div className="flex min-w-0 items-center gap-4">
        <NoteIcon />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed text-neutral-900">{note.text}</p>
          <p className="mt-1.5 text-xs text-neutral-500">
            {note.author} · {note.date}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-neutral-400">
        <button
          aria-label="Editar nota"
          className="rounded-full p-1.5 transition hover:bg-[#eaf5ed] hover:text-[#5a9a7a]"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          aria-label="Eliminar nota"
          className="rounded-full p-1.5 transition hover:bg-[#fde4d4] hover:text-[#c2410c]"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
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
      onCancel={onCancel}
      onChange={onChange}
      onSave={onSave}
      value={value}
    />
  );
}

function ClientNotesTab({ clientId, clientNotes }: { clientId: number; clientNotes?: string | null }) {
  const { user } = useAuth();
  const parsed = useMemo(() => {
    if (!clientNotes) return [];
    try {
      const arr = JSON.parse(clientNotes);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [clientNotes]);
  const [notes, setNotes] = useState<ClientNote[]>(parsed);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (!clientNotes) return;
    try {
      const arr = JSON.parse(clientNotes);
      if (Array.isArray(arr)) setNotes(arr);
    } catch {}
  }, [clientNotes]);

  const persistNotes = useCallback(
    async (updated: ClientNote[]) => {
      setNotes(updated);
      try {
        await updateClient(clientId, { notes: JSON.stringify(updated) });
      } catch {}
    },
    [clientId],
  );

  const startCreate = () => {
    setEditingId(null);
    setEditingText('');
    setDraft('');
    setIsCreating(true);
  };

  const saveNewNote = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const author = user?.name ?? 'Sistema';
    const date = now.toLocaleDateString('es-DO', { dateStyle: 'long' });
    const nextId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
    persistNotes([...notes, { id: nextId, text, author, date }]);
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
    persistNotes(notes.map((note) => (note.id === editingId ? { ...note, text } : note)));
    setEditingId(null);
    setEditingText('');
  };

  const deleteNote = (id: number) => {
    persistNotes(notes.filter((item) => item.id !== id));
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-neutral-500">{notes.length} notas</p>
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#5a9a7a] px-5 text-sm text-white hover:bg-[#4a866a]"
          onClick={startCreate}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nueva nota
        </button>
      </div>

      <div className="space-y-3">
        {notes.map((note, index) =>
          editingId === note.id ? (
            <EditableNoteCard
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
              key={note.id}
              note={note}
              onDelete={() => deleteNote(note.id)}
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
    </div>
  );
}

function ClientInfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ed] text-[#5a9a7a]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ClientInfoGrid({ clientData }: { clientData: ClientDetail }) {
  const cards = buildInfoCards(clientData);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <ClientInfoCard
            icon={<Icon className="h-4 w-4" />}
            key={card.label}
            label={card.label}
            value={card.value}
          />
        );
      })}
    </div>
  );
}

export function ClientDetailPage({ clientId }: { clientId: number }) {
  const [activeTab, setActiveTab] = useState<ClientTab>('Información');
  const [clientData, setClientData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<HistoryEvent[]>([]);

  useEffect(() => {
    setLoading(true);
    getClient(clientId)
      .then(setClientData)
      .catch(() => setClientData(null))
      .finally(() => setLoading(false));

    api.get<ApiResponse<AuditEntryRaw[]>>('/audit', { params: { entityType: 'Client', entityId: clientId } })
      .then((audit) =>
        setAuditEvents(
          (audit.data.data ?? []).map((entry) => ({
            type: entry.action === 'CREATE' ? 'Estado' : entry.action === 'UPDATE' ? 'Nota' : 'Estado',
            title: entry.action === 'CREATE' ? 'Cliente creado' : entry.action === 'UPDATE' ? 'Cliente actualizado' : entry.action,
            author: entry.user?.name ?? 'Sistema',
            date: fmtDate(entry.createdAt),
            amount: undefined,
          })),
        ),
      )
      .catch(() => {});
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Cargando...</p>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm font-medium text-neutral-400">Cliente no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-[#5a9a7a] underline" href="/clientes">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const fullName = `${clientData.firstName} ${clientData.lastName}`;
  const activeLoans = clientData.loans.filter((l) => l.status === 'ACTIVE').length;
  const totalLoaned = clientData.loans.reduce((s, l) => s + l.principal, 0);
  const totalPaid = clientData.loans.reduce((s, l) => s + l.principal - l.balance, 0);
  const totalBalance = clientData.loans.reduce((s, l) => s + l.balance, 0);

  const statsCards = [
    { label: 'Préstamos activos', value: String(activeLoans), icon: BriefcaseBusiness, accent: '#eaf5ed', color: '#5a9a7a' },
    { label: 'Total prestado', value: fmt(totalLoaned), icon: Banknote, accent: '#c2dfcb', color: '#5a9a7a' },
    { label: 'Saldo pendiente', value: fmt(totalBalance), icon: CircleAlert, accent: '#fde4d4', color: '#c2410c' },
    { label: 'Total pagado', value: fmt(totalPaid), icon: CircleCheck, accent: '#dbeafe', color: '#1d4ed8' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5a9a7a] hover:text-[#7fb89a]"
          href="/clientes"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a clientes
        </Link>

        <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm border border-neutral-100">
          <div className="px-8 pt-6 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5">
                {clientData.photo ? (
                  <img
                    src={clientData.photo}
                    alt={fullName}
                    className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#eaf5ed] shadow-md">
                    <UserRound className="h-8 w-8 text-[#5a9a7a]" />
                  </div>
                )}
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-neutral-900">{fullName}</h1>
                    <StatusBadge active={clientData.active} />
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {clientData.identification ?? '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                    {clientData.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {clientData.phone}
                      </span>
                    )}
                    {clientData.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {clientData.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <button className="inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 text-sm text-neutral-700 hover:bg-neutral-50">
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <Link
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#5a9a7a] px-5 text-sm text-white hover:bg-[#4a866a]"
                  href={`/prestamos/nuevo?cliente=${clientId}`}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo préstamo
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsCards.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: k.accent, color: k.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">{k.label}</p>
                    <p className="mt-0.5 text-base font-bold text-neutral-900">{k.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5 flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-neutral-100">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const active = activeTab === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition ${
                  active ? 'bg-[#1f3b2c] text-white shadow-sm' : 'text-neutral-500 hover:bg-[#eaf5ed] hover:text-[#5a9a7a]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'Préstamos' ? (
          <ClientLoansTab loans={clientData.loans} />
        ) : activeTab === 'Documentos' ? (
          <ClientDocumentsTab clientId={clientData.id} />
        ) : activeTab === 'Historial' ? (
          <ClientHistoryTab events={auditEvents} />
        ) : activeTab === 'Notas' ? (
          <ClientNotesTab clientId={clientData.id} clientNotes={clientData.notes} />
        ) : activeTab === 'Información' ? (
          <ClientInfoGrid clientData={clientData} />
        ) : null}
      </div>
    </div>
  );
}

interface AuditEntryRaw {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  createdAt: string;
  user?: { id: string; name: string };
}
