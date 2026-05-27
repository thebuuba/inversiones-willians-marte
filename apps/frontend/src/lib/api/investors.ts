import { api } from '../api';
import type { ApiResponse, InvestorItem, CreateInvestorDto } from '@inversiones/shared';

export async function getInvestors(): Promise<InvestorItem[]> {
  const { data } = await api.get<ApiResponse<InvestorItem[]>>('/investors');
  return data.data ?? [];
}

export async function getInvestor(id: string): Promise<InvestorItem> {
  const { data } = await api.get<ApiResponse<InvestorItem>>(`/investors/${id}`);
  return data.data as InvestorItem;
}

export async function createInvestor(dto: CreateInvestorDto): Promise<InvestorItem> {
  const { data } = await api.post<ApiResponse<InvestorItem>>('/investors', dto);
  return data.data as InvestorItem;
}
