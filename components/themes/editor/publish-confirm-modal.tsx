"use client";

import { motion, AnimatePresence } from "motion/react";
import type { ThemeChange } from "./theme-diff";

type PublishConfirmModalProps = {
  open: boolean;
  publishing: boolean;
  /** 0–100, driven by real publish stages in usePublishTheme. */
  progress: number;
  /** Panel-grouped diff against what's currently live — empty means nothing
   * changed (shouldn't normally reach here, since Publish is disabled then). */
  changes: ThemeChange[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function PublishConfirmModal({
  open,
  publishing,
  progress,
  changes,
  onConfirm,
  onCancel,
}: PublishConfirmModalProps) {
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
            // Dismissing mid-publish would hide a request that is still
            // running, so the backdrop goes inert until it settles.
            onClick={publishing ? undefined : onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5"
          >
            <h3
              id="publish-title"
              className="text-[15px] font-semibold text-foreground"
            >
              Publish changes?
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              This updates your live storefront.
            </p>

            {changes.length > 0 ? (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-border dark:border-transparent bg-search-bg/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  What&apos;s changing
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {changes.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-center justify-between gap-2 text-[13px] text-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="size-1 shrink-0 rounded-full bg-primary" />
                        {c.label}
                      </span>
                      {c.detail ? (
                        <span className="text-[11px] text-slate-400">{c.detail}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {publishing ? (
              <div
                className="mt-4"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-search-bg">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-center text-xs font-medium tabular-nums text-muted">
                  {progress}%
                </p>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Publish
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
