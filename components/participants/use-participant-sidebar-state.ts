"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "diagnosi-ia:participant-sidebar-expanded";
const CHANGE_EVENT = "diagnosi-ia:participant-sidebar-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function getSnapshot() {
  return document.documentElement.dataset.participantSidebar === "expanded";
}

export function useParticipantSidebarState() {
  const expanded = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggle() {
    const nextValue = !getSnapshot();
    document.documentElement.dataset.participantSidebar = nextValue ? "expanded" : "collapsed";
    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextValue));
    } catch {
      // The menu still works when local storage is unavailable.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { expanded, toggle };
}
