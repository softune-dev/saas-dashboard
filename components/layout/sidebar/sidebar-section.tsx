"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type SidebarSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  /** True while the active route lives inside this section — forces it
   * open regardless of the user's stored collapse choice, so a direct link
   * or refresh never lands on a hidden active item. */
  forceOpen?: boolean;
};

const STORAGE_KEY = "softune:sidebar-collapsed-sections";

function readCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeCollapsed(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage can throw in private browsing — collapse state just
    // won't persist, which is harmless.
  }
}

/** Collapsible category group — collapse state persists per-category across
 * sessions, but a section containing the active route always renders open
 * (see forceOpen) so navigating never hides where you are. */
import { useLanguage } from "@/components/providers/language-provider";

export function SidebarSection({ id, title, children, forceOpen }: SidebarSectionProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed().has(id));
  }, [id]);

  const open = forceOpen || !collapsed;

  function toggle() {
    if (forceOpen) return;
    setCollapsed((prev) => {
      const next = !prev;
      const stored = readCollapsed();
      if (next) stored.add(id);
      else stored.delete(id);
      writeCollapsed(stored);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 rounded-md px-3 pb-1 text-left transition-colors hover:text-foreground"
      >
        <span className="text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
          {t(title)}
        </span>
        <ChevronDown
          className={[
            "size-3.5 shrink-0 text-muted-soft transition-transform",
            open ? "" : "-rotate-90",
          ].join(" ")}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <nav className="flex flex-col gap-0.5" aria-label={title}>
          {children}
        </nav>
      ) : null}
    </div>
  );
}
