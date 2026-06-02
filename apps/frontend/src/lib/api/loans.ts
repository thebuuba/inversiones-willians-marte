import { api } from '../api';
import type { ApiResponse, CreateLoanDto, InterestType } from '@inversiones/shared';

export interface LoanListClient {
  id: string;
  firstName: string;
  lastName: string;
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
  _count: { schedule: number };
}

export interface PaginatedLoans {
  data: LoanListItem[];
  total: number;
}

export async function getLoans(status?: string, search?: string, take = 50, skip = 0): Promise<PaginatedLoans> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (take !== 50) params.take = String(take);
  if (skip > 0) params.skip = String(skip);
  const { data } = await api.get<ApiResponse<PaginatedLoans>>('/loans', { params });
  return (data.data as PaginatedLoans) ?? { data: [], total: 0 };
}

export async function getLoan(id: string) {
  const { data } = await api.get<ApiResponse>(`/loans/${id}`);
  return data.data;
}

export async function createLoan(dto: CreateLoanDto) {
  const { data } = await api.post<ApiResponse>('/loans', dto);
  return data.data;
}
