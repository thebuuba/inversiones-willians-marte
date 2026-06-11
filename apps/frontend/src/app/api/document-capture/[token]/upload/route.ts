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

  const formData = await request.formData();
  const response = await fetch(`${getBackendApiUrl()}/documents/capture-sessions/${encodeURIComponent(token)}/upload`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
