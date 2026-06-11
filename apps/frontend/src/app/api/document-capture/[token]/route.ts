import { NextResponse } from 'next/server';

function getBackendApiUrl() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
}

export async function GET(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const response = await fetch(`${getBackendApiUrl()}/documents/capture-sessions/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
