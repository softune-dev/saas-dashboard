"use client";

import { useEffect, useState } from "react";

/** Persists a small UI choice (view mode, etc.) in localStorage — same
 * pattern as the language provider: default first, then hydrate from
 * storage so SSR and the first client render stay in sync. */
export function useLocalPreference<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  const allowedKey = allowed.join("\0");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved && allowedKey.split("\0").includes(saved)) {
        setValue(saved as T);
      }
    } catch {
      // private browsing — preference just won't persist
    }
  }, [key, allowedKey]);

  function set(next: T) {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // ignore
    }
  }

  return [value, set];
}
