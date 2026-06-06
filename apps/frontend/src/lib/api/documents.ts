import { api } from '../api';
import type { ApiResponse, DocumentItem } from '@inversiones/shared';

export async function getDocuments(clientId?: number, investorId?: string): Promise<DocumentItem[]> {
  const params: Record<string, string> = {};
  if (clientId) params.clientId = String(clientId);
  if (investorId) params.investorId = investorId;
  const { data } = await api.get<ApiResponse<DocumentItem[]>>('/documents', { params });
  return data.data ?? [];
}

export async function createDocument(formData: FormData): Promise<DocumentItem> {
  const { data } = await api.post<ApiResponse<DocumentItem>>('/documents', formData);
  return data.data as DocumentItem;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string, filename: string): Promise<void> {
  const { data } = await api.get<Blob>(`/documents/${id}/file`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
