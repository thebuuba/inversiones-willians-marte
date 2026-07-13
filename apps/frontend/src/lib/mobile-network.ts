export interface NetworkAddress {
  address: string;
  family: string | number;
  internal: boolean;
}

function isLanIpv4Address(item: NetworkAddress) {
  return (
    !item.internal &&
    (item.family === 'IPv4' || item.family === 4) &&
    !item.address.startsWith('169.254.')
  );
}

export function getAllowedDevOrigins(
  mobileBaseUrl: string | undefined,
  interfaces: NodeJS.Dict<NetworkAddress[]>,
): string[] {
  const origins = new Set<string>();

  if (mobileBaseUrl) {
    try {
      origins.add(new URL(mobileBaseUrl).hostname);
    } catch {
      // Ignore an invalid optional development URL.
    }
  }

  for (const addresses of Object.values(interfaces)) {
    for (const item of addresses ?? []) {
      if (isLanIpv4Address(item)) origins.add(item.address);
    }
  }

  return [...origins];
}

export function selectLanAddress(interfaces: NodeJS.Dict<NetworkAddress[]>): string | undefined {
  const preferredNames = ['en0', 'en1', 'eth0', 'wlan0'];
  const entries = Object.entries(interfaces).sort(([left], [right]) => {
    const leftIndex = preferredNames.indexOf(left);
    const rightIndex = preferredNames.indexOf(right);
    return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
  });

  for (const [, addresses] of entries) {
    const address = addresses?.find(isLanIpv4Address);
    if (address) return address.address;
  }

  return undefined;
}
