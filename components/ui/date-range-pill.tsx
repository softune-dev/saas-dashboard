"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatDisplayDate,
  fromInputDate,
  toInputDate,
} from "@/lib/format";

export type DateRange = {
  from: Date;
  to: Date;
};

type DateRangePillProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export function DateRangePill({ value, onChange }: DateRangePillProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fromId = useId();
  const toId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const label = `${formatDisplayDate(value.from)} - ${formatDisplayDate(value.to)}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground transition-colors hover:border-slate-300"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
        <span className="whitespace-nowrap font-medium">{label}</span>
        <ChevronDown
          className={[
            "size-4 shrink-0 text-muted transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-30 flex w-72 flex-col gap-3 rounded-md border border-border bg-surface p-3"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={fromId} className="text-xs font-medium text-muted">
              From
            </label>
            <input
              id={fromId}
              type="date"
              value={toInputDate(value.from)}
              max={toInputDate(value.to)}
              onChange={(e) =>
                onChange({
                  from: fromInputDate(e.target.value),
                  to: value.to,
                })
              }
              className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={toId} className="text-xs font-medium text-muted">
              To
            </label>
            <input
              id={toId}
              type="date"
              value={toInputDate(value.to)}
              min={toInputDate(value.from)}
              onChange={(e) =>
                onChange({
                  from: value.from,
                  to: fromInputDate(e.target.value),
                })
              }
              className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
