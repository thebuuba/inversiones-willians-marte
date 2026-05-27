import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface LoanProductItem {
  id: string;
  name: string;
  interestType: string;
  interestRate: number;
  paymentFrequency: string;
  maxAmount: number | null;
  minAmount: number | null;
  maxTerm: number | null;
  active: boolean;
}

export async function getLoanProducts(): Promise<LoanProductItem[]> {
  const { data } = await api.get<ApiResponse<LoanProductItem[]>>('/loan-products');
  return data.data ?? [];
}
