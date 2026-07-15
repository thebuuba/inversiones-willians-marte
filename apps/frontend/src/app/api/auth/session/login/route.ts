import { NextResponse } from 'next/server';
import {
  fetchBackend,
  parseBackendJson,
  setRefreshCookie,
  unavailableResponse,
} from '@/lib/server/auth-session-proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let response: Response;
  try {
    response = await fetchBackend('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return unavailableResponse();
  }

  const body = await parseBackendJson(response);
  const refreshToken = body.data?.refreshToken;
  if (!response.ok || typeof refreshToken !== 'string') {
    return NextResponse.json(body, {
      status: response.status,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const publicData = { ...(body.data ?? {}) };
  delete publicData.refreshToken;
  const result = NextResponse.json(
    { ...body, data: publicData },
    { status: response.status, headers: { 'cache-control': 'no-store' } },
  );
  setRefreshCookie(result, refreshToken);
  return result;
}
