"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useSession } from "@/components/providers/session-provider";
import {
  clearOnboardingCelebration,
  isOnboardingCelebrationPending,
  listTemplates,
} from "@/lib/api";
import { displayStorefrontHost } from "@/lib/format";
import { PrimaryButton } from "@/components/ui/primary-button";

const CONFETTI_COLORS = ["#ff5a36", "#fbbf24", "#34d399", "#60a5fa"];

function fireConfetti() {
  const opts = { colors: CONFETTI_COLORS, disableForReducedMotion: true };
  confetti({
    ...opts,
    particleCount: 90,
    spread: 76,
    origin: { y: 0.55 },
  });
  return window.setTimeout(() => {
    confetti({
      ...opts,
      particleCount: 45,
      angle: 60,
      spread: 52,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      ...opts,
      particleCount: 45,
      angle: 120,
      spread: 52,
      origin: { x: 1, y: 0.7 },
    });
  }, 180);
}

function themeString(theme: Record<string, unknown> | undefined, key: string): string {
  const v = theme?.[key];
  return typeof v === "string" ? v.trim() : "";
}

// Static preview per template key — same source images the trial signup
// wizard's theme step uses (landing/components/auth/trial-theme-step.tsx),
// copied into this app's own /public since landing and dashboard are
// separate deployments. Template.thumbnail_url exists on the backend but
// isn't populated for either real template yet, so this is the actual
// image source until that changes.
const THEME_IMAGES: Record<string, string> = {
  aurora: "/theme-aurora.webp",
  bazaar: "/theme-bazaar.webp",
};

/** One-shot "your store is live" after trial signup handoff. Gated on
 * consuming hash tokens on /onboarding — not on plan=trial, which would
 * replay for three days. */
export function StoreLiveModal() {
  const [fromSignup] = useState(isOnboardingCelebrationPending);
  const { currentSite, me, loading } = useSession();
  const [open, setOpen] = useState(false);

  const shopName =
    themeString(currentSite?.theme, "siteName") ||
    currentSite?.name ||
    me?.tenant.name ||
    "";
  const tagline = themeString(currentSite?.theme, "tagline");
  const host = displayStorefrontHost(currentSite);
  const storeUrl = host ? `https://${host}` : null;

  // The chosen theme's own preview image — proof of "this is what you
  // picked," not the live site's own screenshot (that's captured by a
  // worker job ~90s after publish, so it's never ready this early).
  const [themeImage, setThemeImage] = useState<string | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTemplates()
      .then((templates) => {
        if (cancelled) return;
        const match = templates.find((t) => t.id === currentSite?.template_id);
        setThemeImage(match ? (THEME_IMAGES[match.key] ?? null) : null);
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentSite?.template_id]);

  const ready =
    fromSignup && !loading && templatesLoaded && !!currentSite && !!shopName && !!host;

  useEffect(() => {
    if (ready) setOpen(true);
  }, [ready]);

  function dismiss() {
    clearOnboardingCelebration();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const later = fireConfetti();
    return () => window.clearTimeout(later);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-live-title"
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface sm:h-[300px] sm:flex-row"
          >
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            {themeImage ? (
              <div className="relative hidden shrink-0 py-2.5 pl-2.5 sm:block sm:h-auto sm:w-1/2">
                <div className="relative size-full overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={themeImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                </div>
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden p-6 text-center sm:w-1/2 sm:items-start sm:p-7 sm:text-left">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Check className="size-5" strokeWidth={2.5} />
              </span>
              <h2
                id="store-live-title"
                title={`${shopName} is live!`}
                className="mt-3 flex max-w-full items-baseline gap-1.5 text-2xl font-semibold tracking-tight text-foreground"
              >
                <span className="min-w-0 truncate">{shopName} is live!</span>
                <span className="shrink-0">🎉</span>
              </h2>
              {tagline ? (
                <p className="mt-2 line-clamp-2 max-w-full text-sm text-muted">{tagline}</p>
              ) : null}
              <p className="mt-5 text-xs font-medium tracking-wide text-muted-soft uppercase">
                Your store is live at
              </p>
              {storeUrl ? (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={host ?? undefined}
                  className="mt-1.5 flex max-w-full items-center gap-1.5 text-[15px] font-semibold text-primary hover:underline"
                >
                  <span className="min-w-0 truncate">{host}</span>
                  <ExternalLink className="size-3.5 shrink-0" strokeWidth={2.5} />
                </a>
              ) : null}
              <PrimaryButton
                className="mt-7 px-6 py-2.5"
                onClick={dismiss}
              >
                Set up store
              </PrimaryButton>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
