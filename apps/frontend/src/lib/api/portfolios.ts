import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface PortfolioItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  _count: { loans: number };
}

export async function getPortfolios(): Promise<PortfolioItem[]> {
  const { data } = await api.get<ApiResponse<PortfolioItem[]>>('/portfolios');
  return data.data ?? [];
}

export async function createPortfolio(params: {
  name: string;
  description?: string;
  color?: string;
}): Promise<PortfolioItem> {
  const { data } = await api.post<ApiResponse<PortfolioItem>>('/portfolios', params);
  return data.data as PortfolioItem;
}
