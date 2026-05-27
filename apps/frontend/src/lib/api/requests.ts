import { api } from '../api';
import type { ApiResponse, LoanRequestItem, CreateRequestDto } from '@inversiones/shared';

export async function getRequests(): Promise<LoanRequestItem[]> {
  const { data } = await api.get<ApiResponse<LoanRequestItem[]>>('/requests');
  return data.data ?? [];
}

export async function getRequest(id: string): Promise<LoanRequestItem> {
  const { data } = await api.get<ApiResponse<LoanRequestItem>>(`/requests/${id}`);
  return data.data as LoanRequestItem;
}

export async function createRequest(dto: CreateRequestDto): Promise<LoanRequestItem> {
  const { data } = await api.post<ApiResponse<LoanRequestItem>>('/requests', dto);
  return data.data as LoanRequestItem;
}

export async function approveRequest(id: string): Promise<LoanRequestItem> {
  const { data } = await api.patch<ApiResponse<LoanRequestItem>>(`/requests/${id}/approve`);
  return data.data as LoanRequestItem;
}

export async function rejectRequest(id: string): Promise<LoanRequestItem> {
  const { data } = await api.patch<ApiResponse<LoanRequestItem>>(`/requests/${id}/reject`);
  return data.data as LoanRequestItem;
}
