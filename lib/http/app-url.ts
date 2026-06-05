function normalizeUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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

  if (isLocalUrl(normalizedConfigured) && !isLocalUrl(requestOrigin)) {
    return requestOrigin;
  }

  return normalizedConfigured;
}
