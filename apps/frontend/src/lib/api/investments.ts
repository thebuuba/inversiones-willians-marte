import { api } from '../api';
import type {
  AddInvestorCapitalDto,
  ApiResponse,
  CreateInvestorInvestmentDto,
  InvestorInvestmentDetail,
  InvestorInvestmentSummary,
} from '@inversiones/shared';

export async function createInvestment(
  investorId: string,
  dto: CreateInvestorInvestmentDto,
): Promise<InvestorInvestmentDetail> {
  const { data } = await api.post<ApiResponse<InvestorInvestmentDetail>>(
    `/investors/${investorId}/investments`,
    dto,
  );
  return data.data as InvestorInvestmentDetail;
}

export async function getInvestorInvestments(investorId: string): Promise<InvestorInvestmentSummary[]> {
  const { data } = await api.get<ApiResponse<InvestorInvestmentSummary[]>>(
    `/investors/${investorId}/investments`,
  );
  return data.data ?? [];
}

export async function getInvestment(investmentId: string): Promise<InvestorInvestmentDetail> {
  const { data } = await api.get<ApiResponse<InvestorInvestmentDetail>>(`/investments/${investmentId}`);
  return data.data as InvestorInvestmentDetail;
}

export async function addInvestmentCapital(
  investmentId: string,
  dto: AddInvestorCapitalDto,
): Promise<InvestorInvestmentDetail> {
  const { data } = await api.post<ApiResponse<InvestorInvestmentDetail>>(
    `/investments/${investmentId}/capital-additions`,
    dto,
  );
  return data.data as InvestorInvestmentDetail;
}
