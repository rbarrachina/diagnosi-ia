"use client";

import { useSyncExternalStore } from "react";

const SIDEBAR_STORAGE_KEY = "diagnosi-ia:admin-sidebar-expanded";
const SIDEBAR_CHANGE_EVENT = "diagnosi-ia:admin-sidebar-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
}

function getSnapshot() {
  return document.documentElement.dataset.adminSidebar !== "collapsed";
}

function getServerSnapshot() {
  return true;
}

export function useAdminSidebarState() {
  const expanded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    const nextValue = !getSnapshot();
    document.documentElement.dataset.adminSidebar = nextValue
      ? "expanded"
      : "collapsed";

    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    } catch {
      // El control visual continua funcionant si l'emmagatzematge no està disponible.
    }

    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }

  return { expanded, toggle };
}
