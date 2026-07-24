import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface PortfolioItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt?: string;
  _count: { loans: number };
  totals?: {
    principal: number;
    balance: number;
  };
  loans?: PortfolioLoan[];
}

export interface PortfolioLoan {
  id: string;
  loanNumber: number;
  clientId: number;
  principal: number;
  interestRate: number;
  interestType: string;
  totalAmount: number;
  balance: number;
  status: string;
  collectionStatus: 'CURRENT' | 'PENDING' | 'LATE' | 'EXPIRED';
  createdAt: string;
  nextPaymentDate: string | null;
  amountToCollect: number;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    identification: string | null;
    phone: string | null;
  };
  product: {
    id: string;
    name: string;
  };
}

export async function getPortfolios(): Promise<PortfolioItem[]> {
  const { data } = await api.get<ApiResponse<PortfolioItem[]>>('/portfolios');
  return data.data ?? [];
}

export async function getPortfolio(id: string): Promise<PortfolioItem> {
  const { data } = await api.get<ApiResponse<PortfolioItem>>(`/portfolios/${id}`);
  return data.data as PortfolioItem;
}

export async function createPortfolio(params: {
  name: string;
  description?: string;
  color?: string;
}): Promise<PortfolioItem> {
  const { data } = await api.post<ApiResponse<PortfolioItem>>('/portfolios', params);
  return data.data as PortfolioItem;
}
