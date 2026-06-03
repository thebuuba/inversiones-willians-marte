import { api } from '../api';
import type { ApiResponse, CreateInvestorPaymentDto, InvestorPaymentItem } from '@inversiones/shared';

export async function createInvestorPayment(dto: CreateInvestorPaymentDto): Promise<InvestorPaymentItem> {
  const { data } = await api.post<ApiResponse<InvestorPaymentItem>>('/investor-payments', dto);
  return data.data as InvestorPaymentItem;
}

export async function getInvestorPayments(investorId: string): Promise<InvestorPaymentItem[]> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem[]>>(`/investor-payments/${investorId}`);
  return data.data ?? [];
}

export async function checkInvestorPaymentPeriod(
  investorId: string,
  periodMonth: number,
  periodYear: number,
): Promise<InvestorPaymentItem | null> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem | null>>('/investor-payments/check', {
    params: { investorId, periodMonth, periodYear },
  });
  return data.data ?? null;
}
