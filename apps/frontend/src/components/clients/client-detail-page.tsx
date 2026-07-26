'use client';

import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getClient, updateClient, deleteClient } from '@/lib/api/clients';
import {
  getDocuments,
  createDocument,
  createDocumentCaptureSession,
  closeDocumentCaptureSession,
  deleteDocument,
  renameDocument,
  downloadDocument,
  viewDocument,
} from '@/lib/api/documents';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';
import { formatDop } from '@/lib/currency';
import { buildMobileCaptureUrl } from '@/lib/mobile-capture-url';
import {
  getClientLoanStats,
  getLoanCollectionStatus,
  getNextInstallmentAmount,
} from '@/components/loans/loan-detail.helpers';
import { deleteLoan } from '@/lib/api/loans';
import { invalidateCachePrefix } from '@/lib/use-client-cache';
import {
  countClientNotes,
  formatClientNotesPreview,
  parseClientNotes,
  type ClientNote,
} from './client-notes';
import type { ClientDetail, LoanSummary, DocumentItem, ApiResponse } from '@inversiones/shared';
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  History,
  Check,
  Plus,
  Mail,
  NotebookPen,
  Pencil,
  ScrollText,
  StickyNote,
  TrendingUp,
  Trash2,
  Upload,
  X,
  UserRound,
  Phone,
  CircleCheck,
  CircleAlert,
  Loader2,
  MoreHorizontal,
  QrCode,
  Eye,
} from 'lucide-react';

type ClientTab = 'Información' | 'Préstamos' | 'Documentos' | 'Historial' | 'Estado de Cuenta' | 'Notas';

const tabs: { label: ClientTab; icon: typeof UserRound }[] = [
  { label: 'Información', icon: UserRound },
  { label: 'Préstamos', icon: TrendingUp },
  { label: 'Documentos', icon: FileText },
  { label: 'Historial', icon: History },
  { label: 'Estado de Cuenta', icon: ScrollText },
  { label: 'Notas', icon: StickyNote },
];

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { dateStyle: 'long' });

function buildInfoCards(clientData: ClientDetail) {
  return [
    { label: 'Cédula', value: clientData.identification ?? '—' },
    { label: 'Teléfono', value: clientData.phone ?? '—' },
    { label: 'Tel. alternativo', value: clientData.altPhone ?? '—' },
    { label: 'Correo electrónico', value: clientData.email ?? '—' },
    { label: 'Dirección', value: clientData.address ?? '—' },
    { label: 'Género', value: clientData.gender ?? '—' },
    { label: 'Estado civil', value: clientData.maritalStatus ?? '—' },
    { label: 'Nacionalidad', value: clientData.nationality ?? '—' },
    {
      label: 'Fecha de nacimiento',
      value: clientData.birthDate ? fmtLong(clientData.birthDate) : '—',
    },
    {
      label: 'Dependientes',
      value: clientData.dependents != null ? String(clientData.dependents) : '—',
    },
    { label: 'Cliente desde', value: fmtLong(clientData.createdAt) },
    { label: 'Notas', value: formatClientNotesPreview(clientData.notes) },
  ];
}

interface HistoryEvent {
  type: string;
  amount?: string;
  title: string;
  detail?: string;
  author: string;
  date: string;
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-primary-accent" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-state-neutral-bg px-3 py-1 text-xs font-semibold text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-state-neutral-dot" />
      Inactivo
    </span>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'A tiempo': 'bg-[#4F956B] text-white',
    Pendiente: 'bg-[#4B5054] text-white',
    Atrasado: 'bg-[#F3C34F] text-[#2F2A1E]',
    Vencido: 'bg-[#D87368] text-white',
    Pagado: 'bg-[#6E98BC] text-white',
  };

  return (
    <span
      className={`inline-flex min-h-7 min-w-[88px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em] ${styles[status] ?? 'bg-[#4B5054] text-white'}`}
    >
      {status === 'Pagado' ? 'Terminado' : status}
    </span>
  );
}

const loanTableColumns = 'grid-cols-[70px_170px_150px_150px_minmax(220px,1.4fr)_140px_170px_100px_50px]';

function LoanTableRow({ loan, clientName, onDelete }: { loan: LoanSummary; clientName: string; onDelete: (loanId: string) => void }) {
  const router = useRouter();
  const statusLabel = getLoanCollectionStatus(loan);
  const frequency =
    loan.paymentFreq === 'MONTHLY'
      ? 'Mensual'
      : loan.paymentFreq === 'DAILY'
        ? 'Diario'
        : loan.paymentFreq;
  const paidInstallments = loan.schedule?.filter((row) => row.status === 'PAID').length ?? 0;
  const nextDueDate = loan.schedule?.find((row) => row.status !== 'PAID')?.dueDate;
  const nextInstallmentAmount = getNextInstallmentAmount(
    loan.schedule ?? [],
    loan.totalAmount,
    loan.term,
  );
  const [deletingLoan, setDeletingLoan] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar préstamo #${loan.loanNumber}? Esta acción no se puede deshacer.`)) return;
    setDeletingLoan(true);
    try {
      await deleteLoan(loan.id);
      onDelete(loan.id);
    } catch {
      setDeletingLoan(false);
      alert('Error al eliminar el préstamo.');
    }
  };

  return (
    <div
      className={`grid min-w-[1220px] cursor-pointer ${loanTableColumns} items-center border-t border-border-soft px-5 py-4 text-sm text-text-secondary transition hover:bg-surface-subtle`}
      onDoubleClick={() => router.push(`/prestamos/${loan.id}`)}
      title="Doble clic para abrir el préstamo"
    >
      <span className="font-semibold text-text-primary">{loan.loanNumber}</span>
      <span className="font-semibold tabular-nums text-text-primary">
        {fmt(nextInstallmentAmount)}
      </span>
      <span className="tabular-nums">{fmtDate(nextDueDate ?? loan.endDate ?? loan.startDate)}</span>
      <span>
        <LoanStatusBadge status={statusLabel} />
      </span>
      <span className="truncate font-medium text-text-primary">{clientName}</span>
      <span>{frequency}</span>
      <span className="font-semibold tabular-nums text-text-primary">{fmt(loan.principal)}</span>
      <span className="font-semibold tabular-nums text-text-primary">
        {paidInstallments}/{loan.term}
      </span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-control-compact text-text-subtle hover:bg-state-neutral-bg hover:text-text-secondary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-44 overflow-hidden rounded-panel border border-border-soft bg-card p-1.5 shadow-card"
          >
            <DropdownMenu.Item asChild>
              <Link
                href={`/prestamos/${loan.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
              >
                <Eye className="h-4 w-4" />
                Detalle
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={`/prestamos/cobrar?loanId=${loan.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
              >
                <CreditCard className="h-4 w-4" />
                Cobrar
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={`/prestamos/${loan.id}/editar`}
                className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
              >
                <Pencil className="h-4 w-4" />
                Editar préstamo
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="mx-2 my-1 border-t border-border-soft" />
            <DropdownMenu.Item
              disabled={deletingLoan}
              className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-state-danger outline-none hover:bg-state-danger-bg"
              onSelect={(event) => {
                event.preventDefault();
                if (deletingLoan) return;
                void handleDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
              {deletingLoan ? 'Eliminando...' : 'Eliminar'}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

function ClientLoansTab({ loans, clientName, onDeleteLoan }: { loans: LoanSummary[]; clientName: string; onDeleteLoan: (loanId: string) => void }) {
  return (
    <div className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Préstamos del cliente</h3>
          <p className="mt-0.5 text-xs text-text-subtle">
            Selecciona una fila para consultar el préstamo
          </p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
          {loans.length} {loans.length === 1 ? 'préstamo' : 'préstamos'}
        </span>
      </div>

      {loans.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <p className="text-sm text-text-subtle">Sin préstamos registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className={`grid min-w-[1220px] ${loanTableColumns} bg-surface-subtle px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-text-muted`}
          >
            <span>#</span>
            <span>Cuota</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Cliente</span>
            <span>Frecuencia</span>
            <span>Capital</span>
            <span>Cuotas</span>
            <span />
          </div>
          {loans.map((loan) => (
            <LoanTableRow key={loan.id} clientName={clientName} loan={loan} onDelete={onDeleteLoan} />
          ))}
        </div>
      )}
    </div>
  );
}

const documentTypeLabels: Record<string, string> = {
  cedula: 'Cédula',
  recibo: 'Recibo',
  acto_notarial: 'Acto notarial',
  otro: 'Otro',
  general: 'General',
};

const processingStatusLabels: Record<
  string,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  processed: {
    label: 'Procesado',
    className: 'bg-state-success-bg text-state-success',
    icon: CircleCheck,
  },
  needs_review: {
    label: 'Revisar',
    className: 'bg-state-warning-bg text-state-warning',
    icon: CircleAlert,
  },
  failed: {
    label: 'Fallo',
    className: 'bg-state-danger-bg text-state-danger',
    icon: CircleAlert,
  },
  not_applicable: {
    label: 'No aplica',
    className: 'bg-state-neutral-bg text-text-muted',
    icon: CircleAlert,
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-state-info-bg text-state-info',
    icon: CircleAlert,
  },
};

function DocumentCard({
  doc,
  onDelete,
  onRename,
}: {
  doc: DocumentItem;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
}) {
  const typeKey = doc.documentType ?? doc.category ?? 'otro';
  const status = doc.processingStatus ? processingStatusLabels[doc.processingStatus] : null;
  const StatusIcon = status?.icon;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(doc.name);
  const [savingName, setSavingName] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [fileError, setFileError] = useState('');

  async function openDocument() {
    setFileError('');
    try {
      await viewDocument(doc.id);
    } catch {
      setFileError(
        'El archivo no está disponible. Puedes eliminar este registro y subirlo otra vez.',
      );
    }
  }

  async function saveDocument() {
    setFileError('');
    try {
      await downloadDocument(doc.id, doc.name);
    } catch {
      setFileError(
        'El archivo no está disponible. Puedes eliminar este registro y subirlo otra vez.',
      );
    }
  }

  async function saveName() {
    const name = draftName.trim();
    if (!name || name === doc.name) {
      setDraftName(doc.name);
      setEditing(false);
      return;
    }
    setSavingName(true);
    setRenameError('');
    try {
      await onRename(doc.id, name);
      setEditing(false);
    } catch {
      setRenameError('No se pudo cambiar el nombre.');
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded-panel border border-border-soft bg-card px-5 py-4 shadow-card transition hover:bg-primary-soft/30"
      onClick={() => {
        if (doc.fileUrl) void openDocument();
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control-comfortable bg-primary-soft">
          <FileText className="h-5 w-5 text-primary-accent" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div
              className="flex min-w-0 items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                aria-label="Nuevo nombre del documento"
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-control-comfortable border border-primary-accent bg-card px-3 text-sm font-semibold text-text-primary outline-none ring-2 ring-primary-soft"
                disabled={savingName}
                maxLength={160}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveName();
                  if (event.key === 'Escape') {
                    setDraftName(doc.name);
                    setEditing(false);
                    setRenameError('');
                  }
                }}
                value={draftName}
              />
              <button
                aria-label="Guardar nombre"
                className="rounded-full bg-primary-accent p-2 text-white transition hover:bg-primary disabled:opacity-50"
                disabled={savingName || !draftName.trim()}
                onClick={() => void saveName()}
                type="button"
              >
                {savingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                aria-label="Cancelar cambio de nombre"
                className="rounded-full border border-primary-border p-2 text-text-muted transition hover:bg-surface-subtle"
                disabled={savingName}
                onClick={() => {
                  setDraftName(doc.name);
                  setEditing(false);
                  setRenameError('');
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="truncate text-sm font-semibold text-text-primary">{doc.name}</p>
          )}
          {renameError ? (
            <p className="mt-1 text-xs font-semibold text-state-danger">{renameError}</p>
          ) : null}
          {fileError ? (
            <p className="mt-1 text-xs font-semibold text-state-danger">{fileError}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-accent">
              {documentTypeLabels[typeKey] ?? typeKey}
            </span>
            {status && StatusIcon ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            ) : null}
            {doc.fileSize ? <span>{(doc.fileSize / 1024).toFixed(1)} KB</span> : null}
            <span>{fmtDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-text-subtle">
        {!editing ? (
          <button
            aria-label={`Cambiar nombre de ${doc.name}`}
            className="rounded-full p-1.5 transition hover:bg-primary-soft hover:text-primary-accent"
            onClick={(event) => {
              event.stopPropagation();
              setDraftName(doc.name);
              setEditing(true);
              setRenameError('');
            }}
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
        {doc.fileUrl && (
          <button
            aria-label={`Ver ${doc.name}`}
            className="rounded-full p-1.5 transition hover:bg-primary-soft hover:text-primary-accent"
            onClick={(e) => {
              e.stopPropagation();
              void openDocument();
            }}
            type="button"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {doc.fileUrl && (
          <button
            aria-label={`Descargar ${doc.name}`}
            className="rounded-full p-1.5 transition hover:bg-primary-soft hover:text-primary-accent"
            onClick={(e) => {
              e.stopPropagation();
              void saveDocument();
            }}
            type="button"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <button
          aria-label={`Eliminar ${doc.name}`}
          className="rounded-full p-1.5 transition hover:bg-state-danger-bg hover:text-state-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UploadModal({
  open,
  clientId,
  documentsCount,
  onClose,
  onUpload,
  uploading,
}: {
  open: boolean;
  clientId: number;
  documentsCount: number;
  onClose: () => void;
  onUpload: (file: File, name: string) => Promise<void>;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [captureToken, setCaptureToken] = useState('');
  const [captureLimitLabel, setCaptureLimitLabel] = useState('');
  const [creatingCaptureSession, setCreatingCaptureSession] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureInitialCount, setCaptureInitialCount] = useState<number | null>(null);
  const captureReceived =
    open &&
    Boolean(qrDataUrl) &&
    captureInitialCount != null &&
    documentsCount > captureInitialCount;

  const resetForm = useCallback(() => {
    setFile(null);
    setName('');
    setCaptureUrl('');
    setQrDataUrl('');
    setCaptureToken('');
    setCaptureLimitLabel('');
    setCaptureError('');
    setCaptureInitialCount(null);
  }, []);

  const closeModal = useCallback(() => {
    if (captureToken) {
      closeDocumentCaptureSession(captureToken).catch((error) => {
        console.error('Error al cerrar sesion de captura movil:', error);
      });
    }
    resetForm();
    onClose();
  }, [captureToken, onClose, resetForm]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setName(f.name.replace(/\.[^/.]+$/, ''));
    }
  }

  async function handleSubmit() {
    if (!file) return;
    await onUpload(file, name || file.name);
    resetForm();
    onClose();
  }

  async function handleCreateCaptureSession() {
    setCreatingCaptureSession(true);
    setCaptureError('');
    try {
      if (captureToken) {
        await closeDocumentCaptureSession(captureToken).catch((error) => {
          console.error('Error al cerrar sesion de captura movil anterior:', error);
        });
      }
      const session = await createDocumentCaptureSession(clientId);
      const nextCaptureUrl = await buildMobileCaptureUrl(
        `/captura-documento/${encodeURIComponent(session.token)}`,
      );
      const nextQrDataUrl = await QRCode.toDataURL(nextCaptureUrl, {
        margin: 1,
        width: 240,
        color: { dark: '#173D2C', light: '#FFFFFF' },
      });
      setCaptureUrl(nextCaptureUrl);
      setQrDataUrl(nextQrDataUrl);
      setCaptureToken(session.token);
      setCaptureLimitLabel(
        session.maxUploads
          ? `${session.uploadCount ?? 0}/${session.maxUploads} documentos permitidos`
          : '',
      );
      setCaptureInitialCount(documentsCount);
    } catch (error) {
      console.error('Error al crear sesion de captura movil:', error);
      setCaptureError('No se pudo generar el QR. Intenta de nuevo.');
    } finally {
      setCreatingCaptureSession(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-panel bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-bold text-text-primary">Subir documento</h3>
        <p className="mb-5 text-sm text-text-muted">
          Selecciona un archivo y asigna un nombre opcional.
        </p>

        <div className="mb-4 rounded-control-comfortable border border-primary-border bg-primary-soft p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Capturar con teléfono</p>
              <p className="mt-1 text-xs text-text-muted">
                Genera un QR para tomar la foto desde el celular.
              </p>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-accent text-white transition hover:bg-primary disabled:opacity-50"
              disabled={creatingCaptureSession}
              onClick={handleCreateCaptureSession}
              title="Generar QR de captura"
              type="button"
            >
              {creatingCaptureSession ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
            </button>
          </div>

          {qrDataUrl ? (
            <div className="mt-4 flex flex-col items-center rounded-control-comfortable bg-card p-4 text-center">
              <Image
                alt="QR para capturar documento con el teléfono"
                className="h-44 w-44"
                height={176}
                src={qrDataUrl}
                unoptimized
                width={176}
              />
              <p className="mt-3 text-xs font-medium text-text-secondary">
                {captureReceived
                  ? 'Documento recibido. Puedes subir otro desde el teléfono.'
                  : 'Escanea este QR con el teléfono.'}
              </p>
              {captureLimitLabel ? (
                <p className="mt-1 text-xs font-medium text-text-muted">{captureLimitLabel}</p>
              ) : null}
              <p className="mt-1 break-all text-xs text-text-subtle">{captureUrl}</p>
            </div>
          ) : null}

          {captureError ? (
            <p className="mt-3 text-xs font-semibold text-state-danger">{captureError}</p>
          ) : null}
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            Archivo
          </label>
          <label className="flex h-24 cursor-pointer items-center justify-center rounded-control-comfortable border-2 border-dashed border-primary-border bg-surface-subtle text-sm text-text-subtle transition hover:border-primary-accent hover:bg-primary-soft/30">
            {file ? (
              <span className="font-medium text-text-secondary">{file.name}</span>
            ) : (
              <span>Haz clic para seleccionar un archivo</span>
            )}
            <input
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
              type="file"
            />
          </label>
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            Nombre <span className="text-neutral-300">(opcional)</span>
          </label>
          <input
            className="h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition placeholder:text-text-subtle focus:border-primary-accent focus:ring-2 focus:ring-[#eaf5ed]"
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del documento"
            value={name}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="h-10 rounded-full border border-primary-border bg-card px-5 text-sm font-semibold text-text-secondary transition hover:bg-surface-subtle"
            disabled={uploading}
            onClick={closeModal}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-50"
            disabled={!file || uploading}
            onClick={handleSubmit}
            type="button"
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientDocumentsTab({ clientId }: { clientId: number }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const refreshDocuments = useCallback(() => {
    getDocuments(clientId).then(setDocuments);
  }, [clientId]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  useEffect(() => {
    if (!showModal) return;
    const interval = window.setInterval(refreshDocuments, 3000);
    return () => window.clearInterval(interval);
  }, [refreshDocuments, showModal]);

  async function handleUpload(file: File, name: string) {
    setUploading(true);
    try {
      const fd = new FormData();
      await appendDocumentUploadFiles(fd, file);
      fd.append('name', name);
      fd.append('clientId', String(clientId));
      await createDocument(fd);
      const docs = await getDocuments(clientId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error al subir archivo:', err);
      alert('Error al subir el archivo. Verifica que el archivo no exceda 10 MB.');
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(id: string) {
    deleteDocument(id)
      .then(() => setDocuments((prev) => prev.filter((d) => d.id !== id)))
      .catch(console.error);
  }

  async function handleRename(id: string, name: string) {
    const updated = await renameDocument(id, name);
    setDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, name: updated.name } : document,
      ),
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-text-muted">{documents.length} documentos archivados</p>
        <button
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm text-white hover:bg-primary"
          onClick={() => setShowModal(true)}
          type="button"
        >
          <Upload className="h-4 w-4" />
          Subir documento
        </button>
      </div>

      <UploadModal
        open={showModal}
        clientId={clientId}
        documentsCount={documents.length}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {documents.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-subtle lg:col-span-2">
            Sin documentos adjuntos.
          </p>
        ) : (
          documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} onRename={handleRename} />
          ))
        )}
      </div>
    </div>
  );
}

function historyTone(type: string) {
  const styles: Record<string, { className: string; icon: typeof CreditCard }> =
    {
      Pago: { className: 'bg-primary-soft text-primary-accent', icon: CreditCard },
      Cliente: { className: 'bg-state-info-bg text-state-info', icon: UserRound },
      Préstamo: { className: 'bg-state-neutral-bg text-text-secondary', icon: TrendingUp },
      Nota: { className: 'bg-state-warning-bg text-state-warning', icon: StickyNote },
      Documento: { className: 'bg-primary-soft text-primary-accent', icon: NotebookPen },
    };
  return styles[type] ?? styles.Nota;
}

function TimelineItem({ event }: { event: HistoryEvent }) {
  const style = historyTone(event.type);
  const Icon = style.icon;

  return (
    <div className="relative grid grid-cols-[30px_1fr] gap-5">
      <div className="relative flex justify-center">
        <span
          className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-card ${style.className}`}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <div className="rounded-panel border border-border-soft bg-card px-5 py-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
              >
                {event.type}
              </span>
              {event.amount && (
                <span className="text-sm font-bold text-primary-accent">{event.amount}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-text-primary">{event.title}</h3>
            {event.detail ? <p className="mt-1 text-xs text-text-secondary">{event.detail}</p> : null}
            <p className="mt-1 text-xs text-text-muted">{event.author}</p>
          </div>
          <time className="shrink-0 text-xs text-text-subtle">{event.date}</time>
        </div>
      </div>
    </div>
  );
}

function ClientHistoryTab({ events, loading }: { events: HistoryEvent[]; loading: boolean }) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[14px] top-0 w-px bg-border-soft" />
      <div className="space-y-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-text-subtle">Cargando historial...</p>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-subtle">Sin actividad registrada.</p>
        ) : (
          events.map((event, index) => (
            <TimelineItem event={event} key={`${event.type}-${event.date}-${index}`} />
          ))
        )}
      </div>
    </div>
  );
}

function NoteIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control-comfortable bg-state-warning-bg text-state-warning">
      <FileText className="h-4 w-4" />
    </span>
  );
}

function NoteActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex flex-col justify-end gap-2 sm:flex-row">
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-primary-border bg-card px-4 text-sm font-semibold text-text-secondary transition hover:bg-surface-subtle"
        onClick={onCancel}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
        Cancelar
      </button>
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary-accent px-4 text-sm font-semibold text-white transition hover:bg-primary"
        onClick={onSave}
        type="button"
      >
        <Check className="h-3.5 w-3.5" />
        Guardar
      </button>
    </div>
  );
}

function NoteTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      autoFocus
      className="h-[78px] w-full resize-none rounded-control-comfortable border border-primary-border bg-card px-4 py-3 text-sm font-medium leading-relaxed text-text-primary outline-none transition placeholder:text-text-subtle focus:border-primary-accent focus:ring-2 focus:ring-[#eaf5ed]"
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
    <div className="rounded-panel border border-primary-accent bg-card p-4 shadow-card">
      <div className="grid grid-cols-[36px_1fr] gap-4">
        <NoteIcon />
        <div>
          <NoteTextarea onChange={onChange} placeholder="Escribe una nota..." value={value} />
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-text-muted">
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
    <div className="flex items-center justify-between gap-4 rounded-panel border border-border-soft bg-card px-5 py-4 shadow-card transition hover:bg-primary-soft/30">
      <div className="flex min-w-0 items-center gap-4">
        <NoteIcon />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed text-text-primary">{note.text}</p>
          <p className="mt-1.5 text-xs text-text-muted">
            {note.author} · {note.date}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-text-subtle">
        <button
          aria-label="Editar nota"
          className="rounded-full p-1.5 transition hover:bg-primary-soft hover:text-primary-accent"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          aria-label="Eliminar nota"
          className="rounded-full p-1.5 transition hover:bg-state-danger-bg hover:text-state-danger"
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
  return <EditableNoteCard onCancel={onCancel} onChange={onChange} onSave={onSave} value={value} />;
}

function ClientAccountStatementTab({ loans }: { loans: LoanSummary[] }) {
  const totalPrincipal = loans.reduce((s, l) => s + Number(l.principal), 0);
  const totalBalance = loans.reduce((s, l) => s + Number(l.balance), 0);
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const paidLoans = loans.filter((l) => l.status === 'PAID');
  const overdueLoans = activeLoans.filter(
    (l) => l.schedule?.some((p) => p.status === 'OVERDUE'),
  );

  const summary = [
    { label: 'Préstamos activos', value: activeLoans.length, color: 'text-blue-600' },
    { label: 'Préstamos pagados', value: paidLoans.length, color: 'text-primary-accent' },
    { label: 'Capital total prestado', value: fmt(totalPrincipal), color: 'text-text-primary' },
    { label: 'Balance total pendiente', value: fmt(totalBalance), color: 'text-state-danger' },
    { label: 'Cuotas vencidas', value: overdueLoans.length, color: 'text-state-danger' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-panel border border-border-soft bg-card p-5 shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              {s.label}
            </p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loans.length > 0 && (
        <div className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
          <div className="border-b border-border-soft px-5 py-4">
            <h3 className="text-sm font-bold text-text-primary">Detalle de préstamos</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[800px] grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 bg-surface-subtle px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
              <span># Préstamo</span>
              <span>Capital</span>
              <span>Balance</span>
              <span>Cuotas</span>
              <span>Frecuencia</span>
              <span>Estado</span>
            </div>
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="grid min-w-[800px] grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-t border-border-soft px-5 py-3 text-sm"
              >
                <span className="font-medium text-text-primary">{loan.loanNumber}</span>
                <span className="text-text-secondary">{fmt(loan.principal)}</span>
                <span className="text-text-secondary">{fmt(loan.balance)}</span>
                <span className="text-text-secondary">{loan.term} cuotas</span>
                <span className="text-text-secondary">
                  {loan.paymentFreq === 'WEEKLY'
                    ? 'Semanal'
                    : loan.paymentFreq === 'BIWEEKLY'
                      ? 'Quincenal'
                      : 'Mensual'}
                </span>
                <span
                  className={`font-semibold ${
                    loan.status === 'ACTIVE'
                      ? 'text-blue-600'
                      : loan.status === 'PAID'
                        ? 'text-primary-accent'
                        : 'text-text-subtle'
                  }`}
                >
                  {loan.status === 'ACTIVE'
                    ? 'Activo'
                    : loan.status === 'PAID'
                      ? 'Pagado'
                      : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientNotesTab({
  clientId,
  clientNotes,
  onNotesChange,
}: {
  clientId: number;
  clientNotes?: string | null;
  onNotesChange: (notes: string) => void;
}) {
  const { user } = useAuth();
  const parsed = useMemo(() => parseClientNotes(clientNotes), [clientNotes]);
  const [notes, setNotes] = useState<ClientNote[]>(parsed);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setNotes(parsed);
    });
    return () => {
      cancelled = true;
    };
  }, [parsed]);

  const persistNotes = useCallback(
    async (updated: ClientNote[]) => {
      setNotes(updated);
      const serialized = JSON.stringify(updated);
      onNotesChange(serialized);
      try {
        await updateClient(clientId, { notes: serialized });
      } catch {}
    },
    [clientId, onNotesChange],
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
        <p className="text-sm text-text-muted">{notes.length} notas</p>
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm text-white hover:bg-primary"
          onClick={startCreate}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nueva nota
        </button>
      </div>

      <div className="space-y-3">
        {notes.map((note) =>
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

function ClientInfoGrid({ clientData }: { clientData: ClientDetail }) {
  const cards = buildInfoCards(clientData);

  return (
    <div className="rounded-panel border border-border-soft bg-card p-6 shadow-card">
      <h3 className="mb-5 text-base font-semibold text-text-primary">Información personal</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              {card.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientDetailPage({ clientId }: { clientId: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ClientTab>('Préstamos');
  const [clientData, setClientData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<HistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingClientRef = useRef(false);

  const loadHistory = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setHistoryLoading(true);
    });
    api
      .get<ApiResponse<ClientHistoryEntryRaw[]>>(`/audit/client/${clientId}/history`)
      .then((audit) => {
        if (!cancelled) {
          setAuditEvents(
            (audit.data.data ?? []).map((entry) => ({
              type: entry.type,
              title: entry.title,
              detail: entry.detail,
              author: entry.author,
              date: fmtDate(entry.createdAt),
              amount: entry.amount != null ? fmt(entry.amount) : undefined,
            })),
          );
          setHistoryLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuditEvents([]);
          setHistoryLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setAuditEvents([]);
        setHistoryLoaded(false);
        setHistoryLoading(false);
      }
    });
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    getClient(clientId)
      .then((data) => {
        if (!cancelled) setClientData(data);
      })
      .catch(() => {
        if (!cancelled) setClientData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (activeTab !== 'Historial' || historyLoaded) return;
    return loadHistory();
  }, [activeTab, historyLoaded, loadHistory]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Cargando...</p>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Cliente no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-primary-accent underline" href="/clientes">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const fullName = `${clientData.firstName} ${clientData.lastName}`;
  const activeLoans = clientData.loans.filter((l) => l.status === 'ACTIVE').length;
  const { totalLoaned, totalPaid, totalBalance } = getClientLoanStats(clientData.loans);
  const notesCount = countClientNotes(clientData.notes);
  const firstActiveLoan = clientData.loans.find((l) => l.status === 'ACTIVE');

  const handleDeleteLoan = (loanId: string) => {
    setClientData((current) =>
      current ? { ...current, loans: current.loans.filter((l) => l.id !== loanId) } : current,
    );
  };

  const handleDeleteClient = async () => {
    if (deletingClientRef.current) return;
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return;
    deletingClientRef.current = true;
    setDeleting(true);
    try {
      await deleteClient(clientId);
      invalidateCachePrefix('clients:');
      router.push('/clientes');
    } catch {
      setDeleting(false);
      alert('Error al eliminar el cliente. Intenta de nuevo.');
    } finally {
      deletingClientRef.current = false;
    }
  };

  const statsCards = [
    {
      label: 'Préstamos activos',
      value: String(activeLoans),
      icon: BriefcaseBusiness,
      className: 'bg-primary-soft text-primary-accent',
    },
    {
      label: 'Total prestado',
      value: fmt(totalLoaned),
      icon: Banknote,
      className: 'bg-primary-soft text-primary-accent',
    },
    {
      label: 'Saldo pendiente',
      value: fmt(totalBalance),
      icon: CircleAlert,
      className: 'bg-state-danger-bg text-state-danger',
    },
    {
      label: 'Total pagado',
      value: fmt(totalPaid),
      icon: CircleCheck,
      className: 'bg-state-info-bg text-state-info',
    },
  ];

  return (
    <div className="min-h-screen bg-page font-sans">
      <div className="mx-auto max-w-[1720px] px-6 py-8">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-accent hover:text-primary-accent"
          href="/clientes"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a clientes
        </Link>

        <div className="mb-6 overflow-hidden rounded-panel bg-card shadow-card border border-border-soft">
          <div className="px-8 pt-6 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5">
                {clientData.photo ? (
                  <div
                    aria-label={fullName}
                    className="h-20 w-20 shrink-0 rounded-panel border-4 border-card bg-cover bg-center shadow-card"
                    role="img"
                    style={{ backgroundImage: `url(${clientData.photo})` }}
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-panel border-4 border-card bg-primary-soft shadow-card">
                    <UserRound className="h-8 w-8 text-primary-accent" />
                  </div>
                )}
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-text-primary">{fullName}</h1>
                    <StatusBadge active={clientData.active} />
                  </div>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {clientData.identification ?? '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
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
              <div className="pb-1">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-accent px-5 text-sm font-semibold text-white hover:bg-primary"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Acciones
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 min-w-52 overflow-hidden rounded-panel border border-border-soft bg-card p-1.5 shadow-card"
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href={`/clientes/${clientId}/editar`}
                          className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar cliente
                        </Link>
                      </DropdownMenu.Item>
                      {firstActiveLoan && (
                        <DropdownMenu.Item asChild>
                          <Link
                            href={`/prestamos/${firstActiveLoan.id}/editar`}
                            className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
                          >
                            <CreditCard className="h-4 w-4" />
                            Editar préstamo
                          </Link>
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item asChild>
                        <Link
                          href={`/prestamos/nuevo?cliente=${clientId}`}
                          className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-text-secondary outline-none hover:bg-primary-soft hover:text-primary-accent"
                        >
                          <Plus className="h-4 w-4" />
                          Nuevo préstamo
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="mx-2 my-1 border-t border-border-soft" />
                      <DropdownMenu.Item
                        disabled={deleting}
className="flex cursor-pointer items-center gap-3 rounded-control-comfortable px-4 py-2.5 text-sm text-state-danger outline-none hover:bg-state-danger-bg"
                        onSelect={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (deleting) return;
                          void handleDeleteClient();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? 'Eliminando...' : 'Eliminar cliente'}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsCards.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-panel bg-card p-5 shadow-card border border-border-soft"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted">{k.label}</p>
                    <p className="mt-0.5 text-base font-bold text-text-primary">{k.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5 flex w-fit gap-1 rounded-panel bg-card p-1.5 shadow-card border border-border-soft">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={`flex items-center gap-2 rounded-control-comfortable px-5 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-primary-accent text-white shadow-card'
                    : 'text-text-muted hover:bg-primary-soft hover:text-primary-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {t.label === 'Notas' && notesCount > 0 ? (
                  <span
                    aria-label={`${notesCount} notas`}
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      active ? 'bg-card text-state-danger' : 'bg-state-danger-bg text-state-danger'
                    }`}
                  >
                    {notesCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {activeTab === 'Préstamos' ? (
          <ClientLoansTab clientName={fullName} loans={clientData.loans} onDeleteLoan={handleDeleteLoan} />
        ) : activeTab === 'Documentos' ? (
          <ClientDocumentsTab clientId={clientData.id} />
        ) : activeTab === 'Historial' ? (
          <ClientHistoryTab events={auditEvents} loading={historyLoading} />
        ) : activeTab === 'Estado de Cuenta' ? (
          <ClientAccountStatementTab loans={clientData.loans} />
        ) : activeTab === 'Notas' ? (
          <ClientNotesTab
            clientId={clientData.id}
            clientNotes={clientData.notes}
            onNotesChange={(notes) =>
              setClientData((current) => (current ? { ...current, notes } : current))
            }
          />
        ) : activeTab === 'Información' ? (
          <ClientInfoGrid clientData={clientData} />
        ) : null}
      </div>
    </div>
  );
}

interface ClientHistoryEntryRaw {
  id: string;
  type: string;
  title: string;
  detail?: string;
  amount?: number;
  author: string;
  createdAt: string;
}
