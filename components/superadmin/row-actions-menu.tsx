"use client";

import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";

export type RowAction = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/** One 3-dot menu per row, replacing a row full of individually-visible
 * icon buttons — the same icon set repeated down every row reads as noise
 * once a table has more than two or three actions. Same outside-click/Escape
 * pattern as themes/editor/pages-manager.tsx's PageRowMenu. */
export function RowActionsMenu({
  label,
  actions,
}: {
  label: string;
  actions: RowAction[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-label={`More actions for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex size-8 items-center justify-center rounded-full transition-colors",
          open
            ? "bg-search-bg text-foreground"
            : "text-muted hover:bg-search-bg hover:text-foreground",
        ].join(" ")}
      >
        <MoreVertical className="size-4" strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={[
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  action.disabled
                    ? "cursor-not-allowed text-muted-soft opacity-60"
                    : action.destructive
                      ? "text-rose-600 hover:bg-rose-500/10"
                      : "text-foreground hover:bg-search-bg",
                ].join(" ")}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
