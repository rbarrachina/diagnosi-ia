"use client";

import { useEffect } from "react";

const FADE_START_PX = 56;
const FADE_DISTANCE_PX = 128;

export function AppHeaderEffects() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-app-header]");

    if (!header) {
      return;
    }

    const appHeader = header;
    let animationFrame = 0;

    function updateHeader() {
      const linearProgress = Math.min(
        1,
        Math.max(0, (window.scrollY - FADE_START_PX) / FADE_DISTANCE_PX),
      );
      const smoothProgress =
        linearProgress * linearProgress * (3 - 2 * linearProgress);
      const progress = Math.min(1, smoothProgress * 1.6);

      appHeader.dataset.scrolled = progress > 0 ? "true" : "false";
      appHeader.style.setProperty("--app-header-progress", progress.toFixed(3));
      animationFrame = 0;
    }

    function handleScroll() {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(updateHeader);
      }
    }

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}
