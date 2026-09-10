"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useMdUp } from "@/lib/hooks/use-md-up";

type SettingsModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom of the sheet on mobile; in-flow on desktop. */
  footer?: ReactNode;
};

const SHEET_EASE = [0.22, 1, 0.36, 1] as const;

export function SettingsModal({
  open,
  title,
  onClose,
  children,
  footer,
}: SettingsModalProps) {
  const mdUp = useMdUp();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            initial={mdUp ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={mdUp ? { opacity: 0 } : { y: "100%" }}
            transition={{
              duration: mdUp ? 0 : 0.22,
              ease: SHEET_EASE,
            }}
            className="modal-panel relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl md:max-h-none md:max-w-md md:rounded-md md:p-5"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 py-4 md:mb-4 md:p-0">
              <h3
                id="settings-modal-title"
                className="text-lg font-medium text-foreground"
              >
                {title}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground dark:hover:bg-search-bg"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 text-sm text-muted md:overflow-visible md:px-0">
              {children}
            </div>
            {footer ? (
              <div className="shrink-0 border-t border-border px-5 py-4 dark:border-transparent max-md:pb-[max(1rem,env(safe-area-inset-bottom))] md:border-0 md:px-0 md:pt-4 md:pb-0">
                {footer}
              </div>
            ) : (
              <div className="shrink-0 max-md:pb-[env(safe-area-inset-bottom)] md:hidden" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
