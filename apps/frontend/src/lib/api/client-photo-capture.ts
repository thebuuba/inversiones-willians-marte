import type { ApiResponse, ClientPhotoCaptureSessionItem } from '@inversiones/shared';
import { api } from '../api';

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
  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    throw Object.assign(new Error(body || 'El servidor devolvió una respuesta inválida.'), {
      response: { status: response.status },
    });
  }
}

export async function createClientPhotoCaptureSession(
  clientId?: number,
): Promise<ClientPhotoCaptureSessionItem> {
  const { data } = await api.post<ApiResponse<ClientPhotoCaptureSessionItem>>(
    '/clients/photo-capture-sessions',
    clientId ? { clientId } : {},
  );
  return data.data as ClientPhotoCaptureSessionItem;
}

export async function getClientPhotoCaptureStatus(
  token: string,
): Promise<ClientPhotoCaptureSessionItem> {
  const { data } = await api.get<ApiResponse<ClientPhotoCaptureSessionItem>>(
    `/clients/photo-capture-sessions/${encodeURIComponent(token)}/status`,
  );
  return data.data as ClientPhotoCaptureSessionItem;
}

export async function getCapturedClientPhoto(token: string): Promise<string> {
  const { data } = await api.get<ApiResponse<{ photo: string }>>(
    `/clients/photo-capture-sessions/${encodeURIComponent(token)}/photo`,
  );
  return (data.data as { photo: string }).photo;
}

export async function closeClientPhotoCaptureSession(token: string): Promise<void> {
  await api.post(`/clients/photo-capture-sessions/${encodeURIComponent(token)}/close`);
}

export async function getPublicClientPhotoCaptureSession(
  token: string,
): Promise<ClientPhotoCaptureSessionItem> {
  const response = await fetch(`/api/client-photo-capture/${encodeURIComponent(token)}`, {
    cache: 'no-store',
    signal: timeoutSignal(15_000),
  });
  const data = await readApiResponse<ClientPhotoCaptureSessionItem>(response);
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'No se pudo validar el enlace.'), {
      response: { status: response.status },
    });
  }
  return data.data as ClientPhotoCaptureSessionItem;
}

export async function uploadClientPhotoCapture(token: string, formData: FormData): Promise<void> {
  const response = await fetch(`/api/client-photo-capture/${encodeURIComponent(token)}/upload`, {
    method: 'POST',
    body: formData,
    signal: timeoutSignal(120_000),
  });
  const data = await readApiResponse<{ uploaded: boolean }>(response);
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'No se pudo subir la fotografía.'), {
      response: { status: response.status },
    });
  }
}
