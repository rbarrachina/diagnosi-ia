const storageKeyPrefix = "diagnosi-ia:submitted:";

function storageKey(publicCode: string): string {
  return `${storageKeyPrefix}${publicCode}`;
}

export function hasLocalSubmission(
  publicCode: string,
  storage: Pick<Storage, "getItem">,
): boolean {
  return storage.getItem(storageKey(publicCode)) === "true";
}

export function markLocalSubmission(
  publicCode: string,
  storage: Pick<Storage, "setItem">,
): void {
  storage.setItem(storageKey(publicCode), "true");
}
