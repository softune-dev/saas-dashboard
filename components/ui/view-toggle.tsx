"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

/** Compact grid/list switch — used on courier, payments, and add-ons. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-full bg-search-bg p-0.5"
      role="group"
      aria-label="View"
    >
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={[
          "inline-flex size-8 items-center justify-center rounded-full transition-colors",
          value === "grid"
            ? "bg-surface text-foreground"
            : "text-muted hover:text-foreground",
        ].join(" ")}
      >
        <LayoutGrid className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={[
          "inline-flex size-8 items-center justify-center rounded-full transition-colors",
          value === "list"
            ? "bg-surface text-foreground"
            : "text-muted hover:text-foreground",
        ].join(" ")}
      >
        <List className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
