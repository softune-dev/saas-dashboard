"use client";

import { AlertCircle, Check, Info, Undo2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import type { ToastItem as ToastItemType, ToastVariant } from "./toast-types";

const variantStyles: Record<
  ToastVariant,
  {
    iconWrap: string;
    icon: string;
    progress: string;
    Icon: typeof Check;
  }
> = {
  success: {
    iconWrap: "bg-emerald-500/12 text-emerald-600",
    icon: "text-emerald-600",
    progress: "bg-emerald-500",
    Icon: Check,
  },
  error: {
    iconWrap: "bg-red-500/12 text-red-600",
    icon: "text-red-600",
    progress: "bg-red-500",
    Icon: AlertCircle,
  },
  info: {
    iconWrap: "bg-primary/12 text-primary",
    icon: "text-primary",
    progress: "bg-primary",
    Icon: Info,
  },
};

type ToastItemProps = {
  item: ToastItemType;
  onDismiss: (id: string) => void;
};

export function ToastItemView({ item, onDismiss }: ToastItemProps) {
  const variant = item.variant ?? "success";
  const { iconWrap, icon, Icon, progress } = variantStyles[variant];
  const duration = item.duration ?? 3200;
  const hasDescription = Boolean(item.description?.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), duration);
    return () => window.clearTimeout(timer);
  }, [duration, item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 10, scale: 0.96, filter: "blur(4px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="pointer-events-auto relative w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-white/60 bg-white/95 backdrop-blur-md"
      style={{
        boxShadow:
          "0 12px 40px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Title-only: center-align icon/title/close so nothing looks “floating”
       * above empty space. With a description, top-align for multi-line text. */}
      <div
        className={[
          "flex gap-3 px-3.5 pr-2.5",
          hasDescription ? "items-start py-3.5" : "items-center py-3",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
            iconWrap,
          ].join(" ")}
        >
          <Icon className="size-4" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-semibold tracking-tight text-foreground">
            {item.title}
          </p>
          {hasDescription ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {item.description}
            </p>
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
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-soft transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Auto-dismiss progress */}
      <div className="h-0.5 w-full bg-slate-100">
        <motion.div
          className={["h-full origin-left", progress].join(" ")}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
