"use client";

import { AnimatePresence, motion } from "motion/react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Generic yes/no confirmation — used before any destructive action
 * (deleting a category/product/etc). Same visual language as the theme
 * editor's PublishConfirmModal. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  busy,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={busy ? undefined : onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xs rounded-2xl bg-surface p-5"
          >
            <h3 id="confirm-title" className="text-[15px] font-semibold text-foreground">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-[13px] text-muted">{description}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={[
                  "inline-flex h-10 flex-1 items-center justify-center rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60",
                  destructive ? "bg-red-600" : "bg-primary",
                ].join(" ")}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
