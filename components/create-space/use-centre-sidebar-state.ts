"use client";

import { useSyncExternalStore } from "react";

const SIDEBAR_STORAGE_KEY = "diagnosi-ia:centre-sidebar-expanded";
const SIDEBAR_CHANGE_EVENT = "diagnosi-ia:centre-sidebar-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
}

function getSnapshot() {
  return document.documentElement.dataset.centreSidebar !== "collapsed";
}

function getServerSnapshot() {
  return true;
}

export function useCentreSidebarState() {
  const expanded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    const nextValue = !getSnapshot();
    document.documentElement.dataset.centreSidebar = nextValue
      ? "expanded"
      : "collapsed";

    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    } catch {
      // The visual control still works when local storage is unavailable.
    }

    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }

  return { expanded, toggle };
}
