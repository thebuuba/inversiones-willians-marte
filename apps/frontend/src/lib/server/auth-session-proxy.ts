import { NextResponse } from 'next/server';

export const REFRESH_COOKIE_NAME = 'wm_refresh_token';
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function getBackendApiUrl() {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api/v1'
  ).replace(/\/$/, '');
}

export function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/auth/session',
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/auth/session',
  });
}

export function unavailableResponse() {
  return NextResponse.json(
    { success: false, error: 'El servicio de autenticación no está disponible.' },
    { status: 502, headers: { 'cache-control': 'no-store' } },
  );
}

export async function parseBackendJson(response: Response) {
  try {
    return (await response.json()) as {
      success?: boolean;
      data?: Record<string, unknown>;
      error?: string;
      message?: string | string[];
    };
  } catch {
    return { success: false, error: 'Respuesta inválida del servicio de autenticación.' };
  }
}
