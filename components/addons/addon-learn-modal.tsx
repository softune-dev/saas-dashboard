"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMdUp } from "@/lib/hooks/use-md-up";
import type { AddonCatalogEntry } from "./addon-data";

type AddonLearnModalProps = {
  open: boolean;
  entry: AddonCatalogEntry | null;
  onClose: () => void;
};

const SHEET_EASE = [0.22, 1, 0.36, 1] as const;

/** Compact info panel for Learn More — no form, just description + Got it. */
export function AddonLearnModal({ open, entry, onClose }: AddonLearnModalProps) {
  const mdUp = useMdUp();
  const Icon = entry?.icon;

  return (
    <AnimatePresence>
      {open && entry ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="addon-learn-title"
            initial={
              mdUp
                ? { opacity: 0, y: 12, scale: 0.98 }
                : { opacity: 0, y: "100%" }
            }
            animate={
              mdUp ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }
            }
            exit={
              mdUp
                ? { opacity: 0, y: 8, scale: 0.98 }
                : { opacity: 0, y: "100%" }
            }
            transition={{ duration: 0.22, ease: SHEET_EASE }}
            className="modal-panel relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl md:max-h-[85vh] md:max-w-md md:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="flex min-w-0 items-center gap-3">
                {entry.logoSrc ? (
                  <span className="flex size-11 shrink-0 items-center justify-start overflow-hidden">
                    <img
                      src={entry.logoSrc}
                      alt=""
                      className="max-h-11 w-auto max-w-full object-contain object-left"
                    />
                  </span>
                ) : Icon ? (
                  <Icon
                    className="size-9 shrink-0 text-foreground"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-wide text-muted-soft uppercase">
                    {entry.category}
                  </p>
                  <h3
                    id="addon-learn-title"
                    className="text-lg font-medium text-foreground"
                  >
                    {entry.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface dark:hover:bg-search-bg"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="text-sm leading-relaxed text-muted">
                {entry.longDescription}
              </p>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-border px-5 py-4 dark:border-transparent max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
