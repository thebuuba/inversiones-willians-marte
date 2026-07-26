'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CreditCard,
  FileText,
  Image as ImageIcon,
  MessageCircle,
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

const statusMap: Record<string, { label: string; className: string; dot: string }> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-state-warning-bg text-state-warning',
    dot: 'bg-state-warning-dot',
  },
  UNDER_REVIEW: {
    label: 'En revisión',
    className: 'bg-state-info-bg text-state-info',
    dot: 'bg-state-info-dot',
  },
  APPROVED: {
    label: 'Aprobada',
    className: 'bg-state-success-bg text-state-success',
    dot: 'bg-state-success-dot',
  },
  REJECTED: {
    label: 'Rechazada',
    className: 'bg-state-danger-bg text-state-danger',
    dot: 'bg-state-danger-dot',
  },
};

const printStatusColors: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: '#FFF4C8', text: '#B89A22' },
  UNDER_REVIEW: { label: 'En revisión', bg: '#E4F0FF', text: '#2F5F91' },
  APPROVED: { label: 'Aprobada', bg: '#E7F4EC', text: '#2F7654' },
  REJECTED: { label: 'Rechazada', bg: '#FFE8D8', text: '#9F3F25' },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusMap[status] ?? {
    label: status,
    className: 'bg-state-neutral-bg text-state-neutral',
    dot: 'bg-state-neutral-dot',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
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
    <div className="flex items-center gap-3 rounded-panel bg-card p-3.5 transition hover:-translate-y-0.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-state-neutral-bg text-text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-text-subtle">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatRequestDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString('es-DO', options);
}

function getPrintableStatus(status: string) {
  return printStatusColors[status] ?? { label: status, bg: '#F3FAF6', text: '#5C6D63' };
}

export function RequestDetailDrawer({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: RequestDetailDrawerProps) {
  const data = request;

  function handlePrint() {
    if (!data) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const status = getPrintableStatus(data.status);
    const fullName = `${data.firstName} ${data.lastName}`;
    const receivedDate = formatRequestDate(data.createdAt, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const shortDate = formatRequestDate(data.createdAt);
    const generatedAt = new Date().toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const description = data.description?.trim();

    win.document.write(`
      <html><head><title>Solicitud ${escapeHtml(data.code)}</title>
      <style>
        @page { size: A4; margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          color: #173D2C;
          font-family: Arial, Helvetica, sans-serif;
          background: #F6FAF7;
        }
        .sheet {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          background: #FFFFFF;
          padding: 18px;
          box-shadow: 0 16px 50px rgba(40, 92, 67, 0.08);
        }
        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          border-radius: 18px;
          background: #F3FAF6;
          border: 1px solid #DDEBE3;
          padding: 16px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-mark {
          display: flex;
          height: 42px;
          width: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #E7F4EC;
          color: #2F7654;
          font-size: 18px;
          font-weight: 900;
        }
        .brand-name {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: .01em;
        }
        .brand-subtitle {
          margin: 3px 0 0;
          color: #5C6D63;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .doc-meta {
          min-width: 190px;
          text-align: right;
        }
        .doc-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }
        .doc-code {
          margin-top: 5px;
          color: #5C6D63;
          font-size: 12px;
          font-weight: 700;
        }
        .status {
          display: inline-flex;
          align-items: center;
          margin-top: 8px;
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 11px;
          font-weight: 800;
        }
        .hero {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 14px;
          margin-top: 18px;
        }
        .applicant-card,
        .amount-card {
          border: 1px solid #B8DCC5;
          border-radius: 20px;
          background: #EEF8F1;
          padding: 18px;
        }
        .amount-card {
          text-align: right;
        }
        .eyebrow {
          margin: 0;
          color: #5C6D63;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
        }
        .applicant-name {
          margin: 9px 0 0;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 900;
        }
        .received {
          margin-top: 8px;
          color: #5C6D63;
          font-size: 12px;
          font-weight: 700;
        }
        .amount {
          margin: 8px 0 0;
          color: #173D2C;
          font-size: 31px;
          line-height: 1;
          font-weight: 900;
        }
        .section {
          margin-top: 18px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 9px;
          color: #53685D;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .section-title:before {
          content: "";
          display: block;
          height: 8px;
          width: 8px;
          border-radius: 999px;
          background: #2F7654;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          border-radius: 18px;
          overflow: hidden;
        }
        .info-cell {
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid #EDF2EF;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 5px 16px rgba(40, 92, 67, 0.035);
        }
        .label {
          color: #5C6D63;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .value {
          margin-top: 5px;
          color: #173D2C;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .description {
          min-height: 92px;
          border: 1px solid #DDEBE3;
          border-radius: 16px;
          background: #fff;
          padding: 14px 16px;
          color: #173D2C;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.55;
          white-space: pre-wrap;
        }
        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: auto;
          border-top: 1px solid #DDEBE3;
          padding-top: 12px;
          color: #5C6D63;
          font-size: 10px;
          font-weight: 700;
        }
        @media print {
          body { min-width: auto; background: #fff; }
          .sheet { box-shadow: none; padding: 0; }
        }
      </style></head><body>
      <main class="sheet">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">IW</div>
            <div>
              <h1 class="brand-name">Inversiones Willians Marte</h1>
              <p class="brand-subtitle">Gestión de solicitudes</p>
            </div>
          </div>
          <div class="doc-meta">
            <h2 class="doc-title">Solicitud de préstamo</h2>
            <div class="doc-code">${escapeHtml(data.code)}</div>
            <div class="status" style="background:${status.bg};color:${status.text}">${escapeHtml(status.label)}</div>
          </div>
        </header>

        <section class="hero">
          <div class="applicant-card">
            <p class="eyebrow">Solicitante</p>
            <h3 class="applicant-name">${escapeHtml(fullName)}</h3>
            <div class="received">Recibido el ${escapeHtml(receivedDate)}</div>
          </div>
          <div class="amount-card">
            <p class="eyebrow">Monto solicitado</p>
            <div class="amount">${escapeHtml(formatDop(data.amount))}</div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title">Datos del solicitante</h3>
          <div class="info-grid">
            <div class="info-cell"><div class="label">Nombre completo</div><div class="value">${escapeHtml(fullName)}</div></div>
            <div class="info-cell"><div class="label">Código</div><div class="value">${escapeHtml(data.code)}</div></div>
            <div class="info-cell"><div class="label">Cédula</div><div class="value">${escapeHtml(data.identification || '—')}</div></div>
            <div class="info-cell"><div class="label">Teléfono</div><div class="value">${escapeHtml(data.phone || '—')}</div></div>
            <div class="info-cell"><div class="label">Referente</div><div class="value">${escapeHtml(data.reference || '—')}</div></div>
            <div class="info-cell"><div class="label">Fecha de solicitud</div><div class="value">${escapeHtml(shortDate)}</div></div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title">Información de la solicitud</h3>
          <div class="info-grid">
            <div class="info-cell"><div class="label">Monto</div><div class="value">${escapeHtml(formatDop(data.amount))}</div></div>
            <div class="info-cell"><div class="label">Estado</div><div class="value">${escapeHtml(status.label)}</div></div>
            <div class="info-cell"><div class="label">Recibido</div><div class="value">${escapeHtml(receivedDate)}</div></div>
            <div class="info-cell"><div class="label">Generado</div><div class="value">${escapeHtml(generatedAt)}</div></div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title">Descripción / propósito</h3>
          <div class="description">${escapeHtml(description || 'Sin descripción registrada.')}</div>
        </section>

        <footer class="footer">
          <span>Documento generado desde Inversiones Willians Marte</span>
          <span>${escapeHtml(data.code)} · ${escapeHtml(generatedAt)}</span>
        </footer>
      </main>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function handleWhatsApp() {
    if (!data) return;
    const text = encodeURIComponent(
      `*Solicitud ${data.code}*\n` +
        `*Cliente:* ${data.firstName} ${data.lastName}\n` +
        `*Monto:* ${formatDop(data.amount)}\n` +
        `*Cédula:* ${data.identification || '—'}\n` +
        `*Teléfono:* ${data.phone || '—'}\n` +
        `*Referente:* ${data.reference || '—'}\n` +
        `*Fecha:* ${new Date(data.createdAt).toLocaleDateString('es-DO')}\n` +
        `${data.description ? `*Descripción:* ${data.description}` : ''}\n` +
        `*Estado:* ${data.status === 'PENDING' ? 'Pendiente' : data.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}\n` +
        `\n— Enviado desde Inversiones Willians Marte`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <AnimatePresence>
      {isOpen && data && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/65"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            animate={{ x: 0 }}
            className="drawer-scroll ml-auto flex h-screen w-full max-w-[540px] flex-col overflow-y-auto border-l border-primary-border bg-page shadow-modal"
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-primary-border bg-card px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-state-neutral-bg text-sm font-bold text-text-secondary">
                  {data.firstName[0]}
                  {data.lastName[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted">{data.code}</p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-text-primary">
                    {data.firstName} {data.lastName}
                  </h2>
                  <div className="mt-2">
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>
              <button
                aria-label="Cerrar detalle"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-border bg-card text-text-muted transition hover:bg-state-neutral-bg hover:text-text-secondary"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 pb-32">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-panel border border-primary-border bg-card p-5"
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.08 }}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                  MONTO SOLICITADO
                </p>
                <p className="mt-3 text-[30px] font-bold leading-none text-text-primary">
                  {formatDop(data.amount)}
                </p>
                <p className="mt-3 text-sm text-text-muted">
                  Recibido el{' '}
                  {new Date(data.createdAt).toLocaleDateString('es-DO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {data.status !== 'PENDING' && (
                  <p className="mt-1.5 text-xs font-bold text-text-muted">
                    {data.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} el{' '}
                    {new Date(data.updatedAt).toLocaleDateString('es-DO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </motion.div>

              <section className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  DATOS DEL SOLICITANTE
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard icon={CreditCard} label="CÉDULA" value={data.identification ?? '—'} />
                  <InfoCard icon={Phone} label="TELÉFONO" value={data.phone ?? '—'} />
                  <InfoCard icon={User} label="REFERENTE" value={data.reference ?? '—'} />
                  <InfoCard
                    icon={Calendar}
                    label="FECHA"
                    value={new Date(data.createdAt).toLocaleDateString('es-DO')}
                  />
                </div>
              </section>

              {data.description && (
                <section className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-text-muted">
                    <FileText className="h-4 w-4" />
                    DESCRIPCIÓN
                  </h3>
                  <div className="rounded-panel bg-card p-4 text-sm leading-relaxed text-text-primary">
                    {data.description}
                  </div>
                </section>
              )}

              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide text-text-muted">
                  <ImageIcon className="h-4 w-4" />
                  FOTOGRAFÍAS
                </h3>
                <div className="flex h-[118px] w-[155px] items-center justify-center rounded-panel bg-state-neutral-bg text-xs text-text-subtle">
                  Sin fotos
                </div>
              </section>
            </div>

            {data.status === 'PENDING' && (
              <div className="fixed bottom-0 right-0 w-full max-w-[540px] border-t border-primary-border bg-card px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full border border-primary-border bg-card text-sm font-bold text-text-primary transition hover:bg-surface-subtle"
                    onClick={handlePrint}
                    type="button"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </button>
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full border border-primary-border bg-card text-sm font-bold text-state-success transition hover:bg-surface-muted-ui"
                    onClick={handleWhatsApp}
                    type="button"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full border border-state-danger-bg bg-card text-sm font-bold text-state-danger transition hover:bg-state-danger-bg"
                    onClick={onReject}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                  <button
                    className="flex h-10 items-center justify-center gap-2.5 rounded-full bg-primary text-sm font-bold text-white shadow-action transition hover:bg-primary-hover"
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
