import type { AuditEntry } from '@/lib/api/dashboard';

const actionLabels: Record<string, string> = {
  CASH_MOVEMENT_CREATED: 'registró un movimiento de caja',
  CLIENT_DELETED: 'eliminó un cliente',
  CLIENT_UPDATED: 'actualizó un cliente',
  COLLECTION_INTERACTION_CREATED: 'registró una gestión de cobro',
  DOCUMENT_DELETED: 'eliminó un documento',
  DOCUMENT_RENAMED: 'renombró un documento',
  INVESTMENT_CAPITAL_ADDED: 'agregó capital a una inversión',
  INVESTMENT_CREATED: 'creó una inversión',
  INVESTOR_PAYMENT_CREATED: 'registró un pago a inversionista',
  LOAN_CAPITAL_ADDED: 'agregó capital a un préstamo',
  LOAN_CREATED: 'creó un préstamo',
  LOAN_PRODUCT_DELETED: 'desactivó un producto de préstamo',
  LOAN_REQUEST_CREATED: 'creó una solicitud de préstamo',
  LOAN_STATUS_CHANGED: 'cambió el estado de un préstamo',
  LOAN_UPDATED: 'actualizó un préstamo',
  NOTE_CREATED: 'agregó una nota',
  NOTE_DELETED: 'eliminó una nota',
  NOTE_UPDATED: 'actualizó una nota',
  PAYMENT_CREATED: 'registró un pago',
  PAYMENT_PROMISE_UPDATED: 'actualizó una promesa de pago',
  PORTFOLIO_DELETED: 'eliminó una cartera',
  TASK_DELETED: 'eliminó una tarea',
  USER_ACTIVE_TOGGLED: 'cambió el acceso de un usuario',
  USER_CREATED: 'creó un usuario',
};

const entityLabels: Record<string, string> = {
  CashMovement: 'Caja',
  Client: 'Cliente',
  CollectionInteraction: 'Cobro',
  Document: 'Documento',
  InvestorInvestment: 'Inversión',
  InvestorPayment: 'Pago a inversionista',
  Loan: 'Préstamo',
  LoanProduct: 'Producto',
  LoanRequest: 'Solicitud',
  Note: 'Nota',
  Payment: 'Pago',
  Portfolio: 'Cartera',
  Task: 'Tarea',
  User: 'Usuario',
};

export type AuditTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface DashboardAuditRow {
  id: string;
  actor: string;
  action: string;
  entity: string;
  reference: string;
  loanHref?: string;
  createdAt: string;
  tone: AuditTone;
}

export function toDashboardAuditRow(entry: AuditEntry): DashboardAuditRow {
  const values = asRecord(entry.newValues);
  const entity = entityLabels[entry.entityType] ?? humanize(entry.entityType);

  return {
    id: entry.id,
    actor: entry.user?.name?.trim() || 'Sistema',
    action: actionLabels[entry.action] ?? humanize(entry.action).toLowerCase(),
    entity,
    reference: entry.loanNumber != null
      ? `Préstamo #${entry.loanNumber}`
      : referenceFor(entity, values),
    loanHref: entry.loanId && entry.loanNumber != null ? `/prestamos/${entry.loanId}` : undefined,
    createdAt: entry.createdAt,
    tone: toneFor(entry.action),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function referenceFor(entity: string, values: Record<string, unknown>): string {
  if (values.loanNumber != null) return `Préstamo #${values.loanNumber}`;
  if (typeof values.code === 'string' && values.code.trim()) return values.code;
  if (typeof values.name === 'string' && values.name.trim()) return values.name;
  if (typeof values.person === 'string' && values.person.trim()) return values.person;
  return entity;
}

function toneFor(action: string): AuditTone {
  if (action.includes('DELETED') || action.includes('REJECTED')) return 'danger';
  if (action.includes('PAYMENT') || action.includes('CREATED') || action.includes('CAPITAL_ADDED')) return 'success';
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('TOGGLED') || action.includes('RENAMED')) return 'info';
  return 'neutral';
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .toLocaleLowerCase('es-DO')
    .replace(/^./, (letter) => letter.toLocaleUpperCase('es-DO'));
}
