function normalizeUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".");

  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => Number(part));

  if (
    octets.some(
      (octet, index) =>
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255 ||
        String(octet) !== parts[index],
    )
  ) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIpv6 = normalized.includes(":");

  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.endsWith(".local") ||
    (isIpv6 &&
      (normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80"))) ||
    isPrivateIpv4(normalized)
  );
}

function isPrivateOrLocalUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return isPrivateOrLocalHostname(hostname);
  } catch {
    return false;
  }
}

export function resolveAppUrl(requestUrl: string, configuredUrl?: string): string {
  const requestOrigin = new URL(requestUrl).origin;
  const configured = configuredUrl?.trim();

  if (!configured) {
    return requestOrigin;
  }

  const normalizedConfigured = normalizeUrl(configured);

  if (!normalizedConfigured) {
    return requestOrigin;
  }

  if (isPrivateOrLocalUrl(requestOrigin)) {
    return requestOrigin;
  }

  if (
    isPrivateOrLocalUrl(normalizedConfigured) &&
    !isPrivateOrLocalUrl(requestOrigin)
  ) {
    return requestOrigin;
  }

  return normalizedConfigured;
}
