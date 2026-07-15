import { NextRequest, NextResponse } from 'next/server';
import {
  clearRefreshCookie,
  getBackendApiUrl,
  parseBackendJson,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  unavailableResponse,
} from '@/lib/server/auth-session-proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: 'No hay una sesión para renovar.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return unavailableResponse();
  }

  const body = await parseBackendJson(response);
  const nextRefreshToken = body.data?.refreshToken;
  if (!response.ok || typeof nextRefreshToken !== 'string') {
    const result = NextResponse.json(body, {
      status: response.status,
      headers: { 'cache-control': 'no-store' },
    });
    if (response.status === 401) clearRefreshCookie(result);
    return result;
  }

  const publicData = { ...(body.data ?? {}) };
  delete publicData.refreshToken;
  const result = NextResponse.json(
    { ...body, data: publicData },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
  setRefreshCookie(result, nextRefreshToken);
  return result;
}
