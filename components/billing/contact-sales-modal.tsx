"use client";

import { X, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Plan } from "./billing-data";

const SALES_EMAIL = "support@softunebd.com";

type ContactSalesModalProps = {
  open: boolean;
  targetPlan: Plan | null;
  currentPlanName: string;
  onClose: () => void;
};

/**
 * There's no payment gateway wired up yet — plan changes are applied
 * manually by the team after a merchant reaches out. This replaces the old
 * "Plan switched" toast (which changed nothing behind it) with a real
 * mailto pre-filled with the actual plan names involved.
 */
export function ContactSalesModal({
  open,
  targetPlan,
  currentPlanName,
  onClose,
}: ContactSalesModalProps) {
  if (!targetPlan) return null;

  const subject = encodeURIComponent(`Plan change request: ${targetPlan.name}`);
  const body = encodeURIComponent(
    `Hi Softunebd team,\n\nI'd like to switch my store's plan from ${currentPlanName} to ${targetPlan.name} (${
      targetPlan.priceMonthly != null ? `৳${targetPlan.priceMonthly.toLocaleString()}/mo` : "custom pricing"
    }).\n\nPlease let me know the next steps.\n\nThanks!`,
  );
  const mailtoHref = `mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`;

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
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-sales-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-surface"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border dark:border-transparent px-5 py-4">
              <h3 id="contact-sales-title" className="text-[15px] font-semibold text-foreground">
                Switch to {targetPlan.name}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4">
              <p className="text-sm text-muted">
                Plan changes aren't automated yet — our team applies them by
                hand after confirming with you. Send us a message and we'll
                get {currentPlanName} → {targetPlan.name} sorted out.
              </p>
              <div className="rounded-xl border border-border/80 bg-search-bg/60 px-3.5 py-3 text-sm">
                <p className="font-semibold text-foreground">{targetPlan.name}</p>
                <p className="text-muted">
                  {targetPlan.priceMonthly != null
                    ? `৳${targetPlan.priceMonthly.toLocaleString()}/mo`
                    : "Custom pricing"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-border dark:border-transparent px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
              >
                Cancel
              </button>
              <a
                href={mailtoHref}
                onClick={onClose}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Mail className="size-3.5" strokeWidth={2} />
                Email sales
              </a>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
