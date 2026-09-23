import type { LoanRequestItem } from '@inversiones/shared';
import { formatDop } from './currency';

export function requestName(request: LoanRequestItem): string {
  return [request.firstName, request.lastName].filter(Boolean).join(' ') || 'Sin nombre';
}

export function requestInitials(request: LoanRequestItem): string {
  return [request.firstName?.[0], request.lastName?.[0]].filter(Boolean).join('') || '?';
}

export function requestAmount(request: LoanRequestItem): string {
  return request.amount == null ? 'Monto sin indicar' : formatDop(request.amount);
}
