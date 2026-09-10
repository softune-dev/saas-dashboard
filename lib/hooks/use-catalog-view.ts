"use client";

import { useEffect, useState } from "react";
import type { ViewMode } from "@/components/ui/view-toggle";

/** Grid/list preference. First visit: list on small screens, grid from `md`
 * up. After the user toggles, the choice is stored and reused. */
export function useCatalogView(key: string): [ViewMode, (mode: ViewMode) => void] {
  const [value, setValue] = useState<ViewMode>("list");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "grid" || saved === "list") {
        setValue(saved);
        return;
      }
      if (window.matchMedia("(min-width: 768px)").matches) setValue("grid");
    } catch {
      // private browsing — stay on the list default
    }
  }, [key]);

  function set(next: ViewMode) {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // ignore
    }
  }

  return [value, set];
}
