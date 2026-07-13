import { NextResponse } from 'next/server';

function getBackendApiUrl() {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api/v1'
  );
}

export async function GET(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  let response: Response;
  try {
    response = await fetch(
      `${getBackendApiUrl()}/clients/photo-capture-sessions/${encodeURIComponent(token)}`,
      { cache: 'no-store' },
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
