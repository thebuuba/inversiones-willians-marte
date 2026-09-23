import { api } from '../api';
import type {
  ApiResponse,
  LoanRequestItem,
  CreateRequestDto,
  UpdateRequestDto,
} from '@inversiones/shared';

export async function getRequestsCount(status?: string): Promise<number> {
  const params = status ? { status } : {};
  const { data } = await api.get<ApiResponse<number>>('/requests/count', { params });
  return (data.data as number) ?? 0;
}

export async function getRequests(): Promise<LoanRequestItem[]> {
  const requests: LoanRequestItem[] = [];
  const take = 100;
  for (;;) {
    const { data } = await api.get<ApiResponse<LoanRequestItem[]>>('/requests', {
      params: { take, skip: requests.length },
    });
    const page = data.data ?? [];
    requests.push(...page);
    if (page.length < take) return requests;
  }
}

export async function getRequest(id: string): Promise<LoanRequestItem> {
  const { data } = await api.get<ApiResponse<LoanRequestItem>>(`/requests/${id}`);
  return data.data as LoanRequestItem;
}

export async function createRequest(dto: CreateRequestDto): Promise<LoanRequestItem> {
  const { data } = await api.post<ApiResponse<LoanRequestItem>>('/requests', dto);
  return data.data as LoanRequestItem;
}

export async function updateRequest(id: string, dto: UpdateRequestDto): Promise<LoanRequestItem> {
  const { data } = await api.patch<ApiResponse<LoanRequestItem>>(`/requests/${id}`, dto);
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

export async function addRequestPhoto(id: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await api.post(`/requests/${id}/photos`, form);
}

export async function getRequestPhotoUrl(id: string, photoId: string): Promise<string> {
  const { data } = await api.get<Blob>(`/requests/${id}/photos/${photoId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}
