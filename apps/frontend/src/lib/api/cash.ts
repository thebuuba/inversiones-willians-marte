import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export type CashMovementType = 'IN' | 'OUT';

export interface CashLedgerMovement {
  id: string;
  type: CashMovementType;
  person: string;
  code: string;
  description: string;
  amount: number;
  movementDate: string;
  category: string;
  paymentMethod?: string | null;
  affectsBalance: boolean;
  sourceType: string;
  registeredBy: string;
}

export interface CashLedgerDay {
  date: string;
  movements: CashLedgerMovement[];
  totals: {
    openingBalance: number;
    income: number;
    expense: number;
    balance: number;
  };
}

export interface CreateManualCashMovement {
  type: CashMovementType;
  person: string;
  amount: number;
  movementDate: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  affectsBalance: boolean;
}

export async function getCashLedger(date: string): Promise<CashLedgerDay> {
  const { data } = await api.get<ApiResponse<CashLedgerDay>>('/cash', { params: { date } });
  return data.data as CashLedgerDay;
}

export async function createManualCashMovement(values: CreateManualCashMovement) {
  const { data } = await api.post<ApiResponse<CashLedgerMovement>>('/cash/movements', values);
  return data.data as CashLedgerMovement;
}

export async function deleteCashMovement(id: string, sourceType: string) {
  await api.delete(`/cash/movements/${encodeURIComponent(sourceType)}/${encodeURIComponent(id)}`);
}
