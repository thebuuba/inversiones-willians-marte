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

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.text();
  if (!body) return {} as ApiResponse<T>;

  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      return { success: false, error: body } as ApiResponse<T>;
    }
    throw new Error('El servidor devolvio una respuesta invalida.');
  }
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

export async function closeDocumentCaptureSession(token: string): Promise<void> {
  await api.post(`/documents/capture-sessions/${encodeURIComponent(token)}/close`);
}

export async function getDocumentCaptureSession(token: string): Promise<DocumentCaptureSessionItem> {
  const response = await fetch(`/api/document-capture/${encodeURIComponent(token)}`, {
    signal: timeoutSignal(10_000),
  });
  const data = await readApiResponse<DocumentCaptureSessionItem>(response);
  if (!response.ok) throw Object.assign(new Error(data.error ?? 'Capture session request failed'), { response });
  return data.data as DocumentCaptureSessionItem;
}

export async function uploadDocumentCapture(token: string, formData: FormData): Promise<DocumentItem> {
  const response = await fetch(`/api/document-capture/${encodeURIComponent(token)}/upload`, {
    method: 'POST',
    body: formData,
    signal: timeoutSignal(120_000),
  });
  const data = await readApiResponse<DocumentItem>(response);
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

export async function viewDocument(id: string, preferProcessed = true): Promise<void> {
  const { data } = await api.get<Blob>(`/documents/${id}/file`, {
    params: { disposition: 'inline', variant: preferProcessed ? 'processed' : 'original' },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
