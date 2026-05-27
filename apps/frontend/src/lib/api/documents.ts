import { api } from '../api';
import type { ApiResponse, DocumentItem, CreateDocumentDto } from '@inversiones/shared';

export async function getDocuments(clientId?: string): Promise<DocumentItem[]> {
  const params: Record<string, string> = {};
  if (clientId) params.clientId = clientId;
  const { data } = await api.get<ApiResponse<DocumentItem[]>>('/documents', { params });
  return data.data ?? [];
}

export async function createDocument(dto: CreateDocumentDto): Promise<DocumentItem> {
  const { data } = await api.post<ApiResponse<DocumentItem>>('/documents', dto);
  return data.data as DocumentItem;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}
