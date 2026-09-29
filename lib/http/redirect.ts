const REDIRECT_BASE_URL = "https://redirect.invalid";

export function safeRelativePath(value: string | null, fallback = "/"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\p{Cc}]/u.test(value)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(value, REDIRECT_BASE_URL);
    if (
      destination.origin !== REDIRECT_BASE_URL ||
      destination.pathname.startsWith("//")
    ) {
      return fallback;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
