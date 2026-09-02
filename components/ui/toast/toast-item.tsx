"use client";

import { AlertCircle, Check, Info, Undo2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ToastItem as ToastItemType, ToastVariant } from "./toast-types";

const variantStyles: Record<
  ToastVariant,
  {
    iconWrap: string;
    icon: string;
    stroke: string;
    Icon: typeof Check;
  }
> = {
  success: {
    iconWrap:
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-300",
    stroke: "stroke-emerald-500 dark:stroke-emerald-400",
    Icon: Check,
  },
  error: {
    iconWrap: "bg-red-500/15 text-red-600 dark:bg-red-400/20 dark:text-red-300",
    icon: "text-red-600 dark:text-red-300",
    stroke: "stroke-red-500 dark:stroke-red-400",
    Icon: AlertCircle,
  },
  info: {
    iconWrap: "bg-primary/15 text-primary dark:bg-primary/25 dark:text-orange-300",
    icon: "text-primary dark:text-orange-300",
    stroke: "stroke-primary dark:stroke-orange-400",
    Icon: Info,
  },
};

const STROKE = 2;
const INSET = STROKE / 2;
const RADIUS = 7;

type ToastItemProps = {
  item: ToastItemType;
  onDismiss: (id: string) => void;
};

export function ToastItemView({ item, onDismiss }: ToastItemProps) {
  const variant = item.variant ?? "success";
  const { iconWrap, icon, Icon, stroke } = variantStyles[variant];
  const duration = item.duration ?? 3200;
  const hasDescription = Boolean(item.description?.trim());
  const uploading = item.progress !== undefined && item.progress < 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // While progress is in flight there's no fixed "done" time to count
    // down to — the timer only starts once progress reaches 100 (or the
    // caller clears the field, converting it back to a normal toast).
    if (uploading) return;
    const timer = window.setTimeout(() => onDismiss(item.id), duration);
    return () => window.clearTimeout(timer);
  }, [duration, item.id, onDismiss, uploading]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const sync = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({ w: Math.round(width), h: Math.round(height) });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rw = Math.max(0, size.w - STROKE);
  const rh = Math.max(0, size.h - STROKE);

  return (
    <motion.div
      ref={rootRef}
      layout
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="pointer-events-auto relative w-[min(100vw-2rem,22rem)] rounded-lg bg-white shadow-[0_8px_30px_-8px_rgba(15,23,42,0.22)] dark:bg-[#32363a] dark:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.55)]"
    >
      {/* Full-box countdown border: track + depleting stroke (works for 3s or 10s undo).
          Skipped while uploading — there's no fixed duration to count down to. */}
      {size.w > 0 && !uploading ? (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          <rect
            x={INSET}
            y={INSET}
            width={rw}
            height={rh}
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-black/10 dark:stroke-white/15"
          />
          <motion.rect
            x={INSET}
            y={INSET}
            width={rw}
            height={rh}
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="butt"
            pathLength={1}
            strokeDasharray="1 1"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 1 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={stroke}
          />
        </svg>
      ) : null}

      <div
        className={[
          "relative flex gap-3 px-3.5 pr-2",
          hasDescription ? "items-start py-3.5" : "items-center py-3",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
            iconWrap,
          ].join(" ")}
        >
          <Icon className="size-3.5" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-semibold tracking-tight text-foreground">
            {item.title}
          </p>
          {hasDescription ? (
            <p className="mt-1 text-xs leading-relaxed text-muted dark:text-zinc-300">
              {item.description}
            </p>
          ) : null}
          {item.progress !== undefined ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                  transition={{ duration: 0.2, ease: "linear" }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-soft">
                {Math.round(item.progress)}%
              </span>
            </div>
          ) : null}
        </div>

        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className={[
              "inline-flex shrink-0 items-center gap-1 self-center text-xs font-semibold",
              icon,
            ].join(" ")}
          >
            <Undo2 className="size-3.5" strokeWidth={2.25} />
            {item.action.label}
          </button>
        ) : null}

        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(item.id)}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-soft transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
