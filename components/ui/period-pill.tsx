"use client";

import { ChevronDown } from "lucide-react";

type PeriodPillProps = {
  label?: string;
};

/** Border-only period selector pill (e.g. "Last 30 Days"). */
export function PeriodPill({ label = "Last 30 Days" }: PeriodPillProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-slate-300"
    >
      {label}
      <ChevronDown className="size-3.5 text-muted" strokeWidth={1.75} />
    </button>
  );
}
