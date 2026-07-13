function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export async function buildMobileCaptureUrl(path: string): Promise<string> {
  if (typeof window === 'undefined') return path;

  const configuredBase = process.env.NEXT_PUBLIC_MOBILE_BASE_URL?.replace(/\/$/, '');
  if (configuredBase) {
    try {
      const configuredUrl = new URL(configuredBase);
      if (!isLocalHostname(configuredUrl.hostname)) return `${configuredBase}${path}`;
    } catch {
      // Continue with automatic discovery.
    }
  }

  const currentUrl = new URL(window.location.href);
  if (!isLocalHostname(currentUrl.hostname)) return `${currentUrl.origin}${path}`;

  try {
    const response = await fetch('/api/mobile-base-url', { cache: 'no-store' });
    if (response.ok) {
      const body = (await response.json()) as { baseUrl?: string };
      if (body.baseUrl) return `${body.baseUrl.replace(/\/$/, '')}${path}`;
    }
  } catch {
    // The visible localhost URL remains useful in emulators and on this computer.
  }

  return `${currentUrl.origin}${path}`;
}
