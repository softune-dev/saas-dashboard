"use client";

import { useEffect, useRef, useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";

export type TableFilterField = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type TableFilterPanelProps = {
  fields: TableFilterField[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  /** Empty state for Clear all (every field key → ""). */
  empty: Record<string, string>;
  ariaLabel?: string;
};

/** Circular filter button + popover used by Products / Orders / etc. */
export function TableFilterPanel({
  fields,
  value,
  onChange,
  empty,
  ariaLabel = "Filters",
}: TableFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeCount = fields.filter((f) => Boolean(value[f.key])).length;

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

  const selectClass =
    "h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative inline-flex size-9 items-center justify-center rounded-full border text-foreground transition-colors",
          open || activeCount > 0
            ? "border-primary bg-primary/5 text-primary"
            : "border-border hover:border-slate-300",
        ].join(" ")}
      >
        <MaskIcon src="/sidebar/filter.svg" className="size-4" />
        {activeCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute top-full right-0 z-30 mt-2 w-72 rounded-xl bg-surface p-4 shadow-lg ring-1 ring-slate-200/80"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Filters</p>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => onChange(empty)}
                className="text-xs font-medium text-primary hover:opacity-80"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">{field.label}</span>
                <select
                  value={value[field.key] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [field.key]: e.target.value })
                  }
                  className={selectClass}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value || "__all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function countRecordFilters(value: Record<string, string>): number {
  return Object.values(value).filter(Boolean).length;
}
