import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface DashboardData {
  activeLoans: number;
  totalClients: number;
  collectionsToday: number;
  portfolioBalance: number;
  overdueLoans: number;
}

export interface PortfolioGroup {
  status: string;
  count: number;
  balance: number;
  principal: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  createdAt: string;
  user?: { id: string; name: string } | null;
  loanId?: string;
  loanNumber?: number;
}

export interface MonthlyCollection {
  month: string;
  collected: number;
  expected: number;
}

export interface WeeklyMovementItem {
  day: string;
  nuevos: number;
  cerrados: number;
}

export interface UpcomingPayment {
  id: string;
  clientName: string;
  dueDate: string;
  amount: number;
  status: string;
}

export interface DashboardOverview {
  dashboard: DashboardData;
  portfolio: PortfolioGroup[];
  monthlyCollections: MonthlyCollection[];
  weeklyMovement: WeeklyMovementItem[];
  upcomingPayments: UpcomingPayment[];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await api.get<ApiResponse<DashboardOverview>>('/reports/overview');
  return data.data as DashboardOverview;
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

export async function getMonthlyCollections(): Promise<MonthlyCollection[]> {
  const { data } = await api.get<ApiResponse<MonthlyCollection[]>>('/reports/collections/monthly');
  return data.data ?? [];
}

export async function getWeeklyMovement(): Promise<WeeklyMovementItem[]> {
  const { data } = await api.get<ApiResponse<WeeklyMovementItem[]>>('/reports/movement/weekly');
  return data.data ?? [];
}

export async function getUpcomingPayments(): Promise<UpcomingPayment[]> {
  const { data } = await api.get<ApiResponse<UpcomingPayment[]>>('/reports/payments/upcoming');
  return data.data ?? [];
}
