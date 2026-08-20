"use client";

import { Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { FormEvent, ReactNode } from "react";

type FormModalProps = {
  open: boolean;
  title: string;
  /** Disables Cancel/backdrop-dismiss and the submit button. Doesn't change
   * the submit button's text by itself — pass the busy-state wording (e.g.
   * "Uploading…" vs "Saving…") through `submitLabel` instead, since a form
   * with an upload step has more than one busy phase to distinguish. */
  busy?: boolean;
  submitLabel?: string;
  /** Hide the header bottom border (compact dialogs). Default true. */
  headerBorder?: boolean;
  /** Tighter padding for short forms. */
  compact?: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  children: ReactNode;
};

/** Shared shell for create/edit forms (categories, products, ...) — a
 * centered panel with a header, scrollable body, and a fixed Cancel/Save
 * footer, so each resource's form only has to define its own fields. */
export function FormModal({
  open,
  title,
  busy,
  submitLabel = "Save",
  headerBorder = true,
  compact = false,
  onSubmit,
  onClose,
  children,
}: FormModalProps) {
  const padX = compact ? "px-4" : "px-5";
  const padY = compact ? "py-3" : "py-4";

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
            onClick={busy ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface"
          >
            <div
              className={[
                "flex shrink-0 items-center justify-between",
                padX,
                padY,
                headerBorder ? "border-b border-border dark:border-transparent" : "",
              ].join(" ")}
            >
              <h3
                id="form-modal-title"
                className="text-[15px] font-semibold text-foreground"
              >
                {title}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={busy}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg disabled:opacity-60"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                className={[
                  "min-h-0 flex-1 overflow-y-auto",
                  padX,
                  compact ? "py-2" : "py-4",
                ].join(" ")}
              >
                {children}
              </div>
              <div
                className={[
                  "flex shrink-0 gap-2 border-t border-border dark:border-transparent",
                  padX,
                  padY,
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-80"
                >
                  {busy ? (
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : null}
                  {submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
