"use client";

import { useSyncExternalStore } from "react";

const MD_UP = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MD_UP);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(MD_UP).matches;
}

/** Tailwind `md` breakpoint. Server/hydration snapshot is `true` so SSR
 * markup matches the existing desktop panel; after mount it tracks the
 * real viewport. Modals open after a click, so the first paint of a
 * sheet already sees the correct value. */
export function useMdUp() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
