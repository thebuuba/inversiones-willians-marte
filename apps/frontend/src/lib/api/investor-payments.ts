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

export async function getInvestmentPayments(investmentId: string): Promise<InvestorPaymentItem[]> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem[]>>(
    `/investor-payments/investment/${investmentId}`,
  );
  return data.data ?? [];
}

export async function checkInvestorPaymentPeriod(
  investorIdOrInvestmentId: string,
  periodMonth: number,
  periodYear: number,
  mode: 'investor' | 'investment' = 'investor',
): Promise<InvestorPaymentItem | null> {
  const { data } = await api.get<ApiResponse<InvestorPaymentItem | null>>('/investor-payments/check', {
    params: {
      [mode === 'investment' ? 'investmentId' : 'investorId']: investorIdOrInvestmentId,
      periodMonth,
      periodYear,
    },
  });
  return data.data ?? null;
}
