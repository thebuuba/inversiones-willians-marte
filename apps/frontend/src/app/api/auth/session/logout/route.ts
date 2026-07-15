import { NextRequest, NextResponse } from 'next/server';
import {
  clearRefreshCookie,
  fetchBackend,
  REFRESH_COOKIE_NAME,
} from '@/lib/server/auth-session-proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await fetchBackend('/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // Local logout still succeeds when the backend is temporarily unavailable.
    }
  }

  const response = new NextResponse(null, { status: 204 });
  clearRefreshCookie(response);
  return response;
}
