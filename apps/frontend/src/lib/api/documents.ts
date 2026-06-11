import { api } from '../api';
import type { ApiResponse, DocumentCaptureSessionItem, DocumentItem } from '@inversiones/shared';

function timeoutSignal(ms: number) {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(ms);
  }

  const controller = new AbortController();
  globalThis.setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

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

export async function createDocumentCaptureSession(clientId: number): Promise<DocumentCaptureSessionItem> {
  const { data } = await api.post<ApiResponse<DocumentCaptureSessionItem>>('/documents/capture-sessions', { clientId });
  return data.data as DocumentCaptureSessionItem;
}

export async function getDocumentCaptureSession(token: string): Promise<DocumentCaptureSessionItem> {
  const response = await fetch(`/api/document-capture/${encodeURIComponent(token)}`, {
    signal: timeoutSignal(10_000),
  });
  const data = (await response.json()) as ApiResponse<DocumentCaptureSessionItem>;
  if (!response.ok) throw Object.assign(new Error(data.error ?? 'Capture session request failed'), { response });
  return data.data as DocumentCaptureSessionItem;
}

export async function uploadDocumentCapture(token: string, formData: FormData): Promise<DocumentItem> {
  const response = await fetch(`/api/document-capture/${encodeURIComponent(token)}/upload`, {
    method: 'POST',
    body: formData,
    signal: timeoutSignal(30_000),
  });
  const data = (await response.json()) as ApiResponse<DocumentItem>;
  if (!response.ok) throw Object.assign(new Error(data.error ?? 'Capture upload request failed'), { response });
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
