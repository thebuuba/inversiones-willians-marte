import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server/auth-session-proxy';

export async function GET(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  let response: Response;
  try {
    response = await fetchBackend(
      `/clients/photo-capture-sessions/${encodeURIComponent(token)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(15_000) },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'El servicio de captura no está disponible.', statusCode: 502 },
      { status: 502 },
    );
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}
