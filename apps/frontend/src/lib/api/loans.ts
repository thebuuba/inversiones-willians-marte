import { api } from '../api';
import type { ApiResponse, CreateLoanDto } from '@inversiones/shared';

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

export interface LoanScheduleItem {
  id: string;
  loanId: string;
  dueDate: string;
  amount: number;
  principalPart: number;
  interestPart: number;
  balanceAfter: number;
  status: string;
  paidDate: string | null;
  paidAmount: number | null;
}

export interface LoanDetailPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
}

export interface LoanDetail extends Omit<LoanListItem, '_count'> {
  schedule: LoanScheduleItem[];
  payments: LoanDetailPayment[];
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

export async function getLoan(id: string): Promise<LoanDetail> {
  const { data } = await api.get<ApiResponse<LoanDetail>>(`/loans/${id}`);
  return data.data as LoanDetail;
}

export async function createLoan(dto: CreateLoanDto) {
  const { data } = await api.post<ApiResponse>('/loans', dto);
  return data.data;
}
