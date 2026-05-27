import { api } from '../api';
import type { ApiResponse, CreatePaymentDto } from '@inversiones/shared';

export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  receivedById?: string;
  receivedBy?: { id: string; name: string };
  allocations?: Array<{
    id: string;
    scheduleId: string;
    amount: number;
    type: string;
  }>;
  createdAt: string;
}

export async function createPayment(dto: CreatePaymentDto): Promise<Payment> {
  const { data } = await api.post<ApiResponse<Payment>>('/payments', dto);
  return data.data as Payment;
}

export async function getPaymentsByLoan(loanId: string): Promise<Payment[]> {
  const { data } = await api.get<ApiResponse<Payment[]>>(`/payments/loan/${loanId}`);
  return data.data ?? [];
}
