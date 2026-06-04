const storageKeyPrefix = "diagnosi-ia:results-token:";

function storageKey(publicCode: string): string {
  return `${storageKeyPrefix}${publicCode}`;
}

export function readPrivateTokenFromLocation(
  publicCode: string,
  location: Pick<Location, "hash" | "pathname">,
  history: Pick<History, "replaceState">,
  storage: Pick<Storage, "getItem" | "setItem">,
): string | null {
  const hash = location.hash.replace(/^#/, "");
  const tokenFromHash = new URLSearchParams(hash).get("token");

  if (tokenFromHash) {
    storage.setItem(storageKey(publicCode), tokenFromHash);
    history.replaceState(null, "", location.pathname);
    return tokenFromHash;
  }

  return storage.getItem(storageKey(publicCode));
}
