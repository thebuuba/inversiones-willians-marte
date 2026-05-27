import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface DashboardData {
  activeLoans: number;
  totalClients: number;
  totalUsers: number;
  collectionsToday: number;
  portfolioBalance: number;
  totalPrincipal: number;
  overdueLoans: number;
  totalLoans: number;
}

export interface PortfolioGroup {
  status: string;
  count: number;
  balance: number;
  principal: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  performedById: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<ApiResponse<DashboardData>>('/reports/dashboard');
  return data.data as DashboardData;
}

export async function getPortfolio(): Promise<PortfolioGroup[]> {
  const { data } = await api.get<ApiResponse<PortfolioGroup[]>>('/reports/portfolio');
  return data.data ?? [];
}

export async function getAudit(): Promise<AuditEntry[]> {
  const { data } = await api.get<ApiResponse<AuditEntry[]>>('/audit');
  return data.data ?? [];
}
