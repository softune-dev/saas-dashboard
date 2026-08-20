"use client";

import { AnimatePresence, motion } from "motion/react";
import { KeyRound, Mail } from "lucide-react";

type ForgotPasswordModalProps = {
  open: boolean;
  initialEmail?: string;
  onClose: () => void;
};

/**
 * Self-service reset needs a real email service (OTP delivery, reset
 * tokens) that doesn't exist yet — see app/worker.py's handle_send_email,
 * still a logged placeholder. Rather than simulate OTP verification and
 * tell someone their password changed when it didn't (actively dangerous —
 * they'd be locked out believing the new one works), this is honest about
 * where things stand and gives a real path: email support directly.
 * Swap this for the real multi-step flow once SMTP is configured.
 */
export function ForgotPasswordModal({
  open,
  initialEmail = "",
  onClose,
}: ForgotPasswordModalProps) {
  if (!open) return null;

  const mailtoHref = `mailto:support@softune.com?subject=${encodeURIComponent(
    "Password reset request",
  )}${initialEmail ? `&body=${encodeURIComponent(`Account email: ${initialEmail}`)}` : ""}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white p-6 sm:p-8 shadow-2xl dark:bg-zinc-900"
        >
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            Self-service reset isn&apos;t live yet
          </h2>
          <p className="mt-1.5 text-xs font-normal leading-relaxed text-muted">
            We&apos;re still setting up email delivery for password resets.
            Email us directly and we&apos;ll reset it for you by hand in the
            meantime.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-border bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Close
            </button>
            <a
              href={mailtoHref}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white shadow-sm transition-all hover:opacity-95"
            >
              <Mail className="size-4" />
              Email support
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
