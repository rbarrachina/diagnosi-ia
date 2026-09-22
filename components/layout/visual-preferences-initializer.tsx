"use client";

import { useEffect } from "react";

import { initializeVisualPreferences } from "@/lib/ui/initialize-visual-preferences";

export function VisualPreferencesInitializer() {
  useEffect(() => {
    initializeVisualPreferences();
  }, []);

  return null;
}
