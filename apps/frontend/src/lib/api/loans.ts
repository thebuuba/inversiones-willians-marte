import { api } from '../api';
import type { ApiResponse, CreateLoanDto, InterestType } from '@inversiones/shared';

export interface LoanListClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  identification: string | null;
}

export interface LoanListProduct {
  id: string;
  name: string;
}

export interface LoanListItem {
  id: string;
  clientId: number;
  productId: string;
  principal: number;
  interestRate: number;
  interestType: string;
  totalAmount: number;
  paymentFreq: string;
  term: number;
  startDate: string;
  endDate: string | null;
  status: string;
  balance: number;
  notes: string | null;
  createdAt: string;
  client: LoanListClient;
  product: LoanListProduct;
  _count: { payments: number; schedule: number };
}

export async function getLoans(status?: string, search?: string): Promise<LoanListItem[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await api.get<ApiResponse<LoanListItem[]>>('/loans', { params });
  return data.data ?? [];
}

export async function getLoan(id: string) {
  const { data } = await api.get<ApiResponse>(`/loans/${id}`);
  return data.data;
}

export async function createLoan(dto: CreateLoanDto) {
  const { data } = await api.post<ApiResponse>('/loans', dto);
  return data.data;
}
