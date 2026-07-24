import { api } from '../api';
import type {
  AddLoanCapitalDto,
  ApiResponse,
  CreateLoanDto,
  LoanPayoffQuote,
  UpdateLoanDto,
} from '@inversiones/shared';

export interface LoanListClient {
  id: number;
  firstName: string;
  lastName: string;
  identification: string | null;
  phone?: string | null;
  altPhone?: string | null;
}

export interface LoanListProduct {
  id: string;
  name: string;
}

export interface LoanListPortfolio {
  id: string;
  name: string;
}

export interface LoanUserSummary {
  id: string;
  name: string;
}

export interface LoanListItem {
  id: string;
  loanNumber: number;
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
  collectionStatus: 'CURRENT' | 'PENDING' | 'LATE' | 'EXPIRED';
  balance: number;
  notes: string | null;
  createdAt: string;
  lateFeeEnabled?: boolean;
  lateFeeMode?: 'PER_INSTALLMENT' | 'DAILY';
  lateFeeCalculation?: 'PERCENTAGE' | 'AMOUNT';
  lateFeeValue?: number;
  lateFeeGraceDays?: number;
  client: LoanListClient;
  product: LoanListProduct;
  portfolio: LoanListPortfolio | null;
  createdBy?: LoanUserSummary | null;
}

export interface PaginatedLoans {
  data: LoanListItem[];
  total: number;
  totalPrincipal: number;
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
  receivedBy?: LoanUserSummary | null;
  allocations?: Array<{
    id: string;
    scheduleId: string;
    amount: number;
    type: string;
  }>;
}

export interface LoanCapitalMovement {
  id: string;
  loanId: string;
  amount: number;
  effectiveDate: string;
  notes: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: LoanUserSummary | null;
}

export interface LoanDetailLateFee {
  id: string;
  loanId: string;
  scheduleId: string;
  amount: number;
  calculatedDate: string;
  paid: boolean;
  paidAmount?: number;
  createdAt: string;
}

export interface LoanDetail extends LoanListItem {
  graceDays: number;
  schedule: LoanScheduleItem[];
  payments: LoanDetailPayment[];
  capitalMovements?: LoanCapitalMovement[];
  lateFees?: LoanDetailLateFee[];
}

export async function getLoans(
  status?: string,
  search?: string,
  take = 50,
  skip = 0,
  sort?: 'recent' | 'oldest' | 'amount_desc' | 'amount_asc',
): Promise<PaginatedLoans> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (take !== 50) params.take = String(take);
  if (skip > 0) params.skip = String(skip);
  if (sort && sort !== 'recent') params.sort = sort;
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

export async function getPayoffQuote(loanId: string, payoffDate: string): Promise<LoanPayoffQuote> {
  const { data } = await api.get<ApiResponse<LoanPayoffQuote>>(`/loans/${loanId}/payoff-quote`, {
    params: { payoffDate },
  });
  return data.data as LoanPayoffQuote;
}

export async function addLoanCapital(loanId: string, dto: AddLoanCapitalDto) {
  const { data } = await api.post<ApiResponse>(`/loans/${loanId}/capital-additions`, dto);
  return data.data;
}

export async function updateLoan(loanId: string, dto: UpdateLoanDto) {
  const { data } = await api.patch<ApiResponse>(`/loans/${loanId}`, dto);
  return data.data;
}

export async function deleteLoan(loanId: string): Promise<void> {
  await api.delete(`/loans/${loanId}`);
}
