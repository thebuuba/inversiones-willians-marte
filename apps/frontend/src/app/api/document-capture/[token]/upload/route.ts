import { NextResponse } from 'next/server';

function getBackendApiUrl() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
}

const MAX_CAPTURE_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_CAPTURE_UPLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Archivo demasiado grande. El limite es 10 MB.', statusCode: 413 },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo leer el archivo seleccionado.', statusCode: 400 },
      { status: 400 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendApiUrl()}/documents/capture-sessions/${encodeURIComponent(token)}/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'El servicio de documentos no esta disponible.', statusCode: 502 },
      { status: 502 },
    );
  }
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
