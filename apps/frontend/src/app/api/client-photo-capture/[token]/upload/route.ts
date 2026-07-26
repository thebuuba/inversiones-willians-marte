import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server/auth-session-proxy';

const MAX_CAPTURE_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_CAPTURE_UPLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: 'La fotografía supera el límite de 5 MB.', statusCode: 413 },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo leer la fotografía.', statusCode: 400 },
      { status: 400 },
    );
  }

  let response: Response;
  try {
    response = await fetchBackend(
      `/clients/photo-capture-sessions/${encodeURIComponent(token)}/upload`,
      { method: 'POST', body: formData, signal: AbortSignal.timeout(120_000) },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'El servicio de captura no está disponible.', statusCode: 502 },
      { status: 502 },
    );
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  });
}
