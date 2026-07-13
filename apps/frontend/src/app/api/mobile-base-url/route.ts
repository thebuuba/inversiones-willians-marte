import { networkInterfaces } from 'os';
import { NextResponse } from 'next/server';
import { selectLanAddress } from '@/lib/mobile-network';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const configuredBase = process.env.MOBILE_BASE_URL?.replace(/\/$/, '');
  if (configuredBase) return NextResponse.json({ baseUrl: configuredBase });

  const address = selectLanAddress(networkInterfaces());
  if (!address) {
    return NextResponse.json({ error: 'No local network address available' }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const port = process.env.NEXT_PUBLIC_PORT ?? requestUrl.port ?? '3001';
  return NextResponse.json({ baseUrl: `${requestUrl.protocol}//${address}:${port}` });
}
