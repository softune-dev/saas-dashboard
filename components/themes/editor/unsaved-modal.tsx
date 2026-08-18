"use client";

import { motion, AnimatePresence } from "motion/react";
import { MaskIcon } from "@/components/ui/mask-icon";

type UnsavedModalProps = {
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** Backdrop click — stay on editor */
  onDismiss?: () => void;
};

export function UnsavedModal({
  open,
  onSave,
  onDiscard,
  onDismiss,
}: UnsavedModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={onDismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-md bg-white p-5"
          >
            <h3
              id="unsaved-title"
              className="text-base font-semibold text-foreground"
            >
              Save changes?
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              You have unsaved site changes. Save before leaving or discard them.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <MaskIcon src="/sidebar/save.svg" className="size-4" />
                Save changes
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                Discard
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
