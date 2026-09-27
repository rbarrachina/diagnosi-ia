/** Resolve missing or empty translations against the Catalan catalogue. */
export function resolveCatalogue<T>(base: T, translated: unknown): T {
  if (typeof base === "string") {
    return (typeof translated === "string" && translated.trim() ? translated : base) as T;
  }
  if (Array.isArray(base)) {
    const entries = Array.isArray(translated) ? translated : [];
    return base.map((entry, index) => resolveCatalogue(entry, entries[index])) as T;
  }
  if (base && typeof base === "object") {
    const entries = translated && typeof translated === "object"
      ? translated as Record<string, unknown>
      : {};
    return Object.fromEntries(
      Object.entries(base).map(([key, value]) => [key, resolveCatalogue(value, entries[key])]),
    ) as T;
  }
  return base;
}
