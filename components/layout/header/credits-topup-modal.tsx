"use client";

import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";

type CreditPack = {
  id: string;
  credits: number;
  /** Real BDT price, in taka. */
  priceBdt: number;
  popular?: boolean;
};

// Priced to roughly track this session's plan pricing (Growth/Business's
// per-credit cost) — not arbitrary round numbers.
const PACKS: CreditPack[] = [
  { id: "starter", credits: 50, priceBdt: 199 },
  { id: "growth", credits: 120, priceBdt: 399, popular: true },
  { id: "pro", credits: 300, priceBdt: 899 },
  { id: "scale", credits: 750, priceBdt: 1999 },
];

function formatPrice(bdt: number) {
  return `৳${bdt.toLocaleString("en-BD")}`;
}

type CreditsTopupModalProps = {
  open: boolean;
  balance: number;
  onClose: () => void;
};

/**
 * Mock credit top-up sheet — same shell language as FormModal / ConfirmDialog
 * (rounded-2xl, dim backdrop, full-width rounded-full actions).
 */
export function CreditsTopupModal({ open, balance, onClose }: CreditsTopupModalProps) {
  const [selectedId, setSelectedId] = useState(
    () => PACKS.find((p) => p.popular)?.id ?? PACKS[0].id,
  );

  const selected = PACKS.find((p) => p.id === selectedId) ?? PACKS[0];

  // Deliberately does nothing — no purchase flow exists until billing
  // ships alongside superadmin. A fake "success" toast here would tell a
  // merchant they bought credits that were never actually added.
  const handleBuy = () => {};

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
            aria-labelledby="credits-topup-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3
                  id="credits-topup-title"
                  className="text-[15px] font-semibold text-foreground"
                >
                  Top up credits
                </h3>
                <p className="mt-0.5 text-[13px] text-muted">
                  Balance{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {balance.toLocaleString()}
                  </span>
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-2 px-5 py-4">
              {PACKS.map((pack) => {
                const active = pack.id === selectedId;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedId(pack.id)}
                    className={[
                      "relative flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border/80 bg-white hover:bg-search-bg/60",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        active
                          ? "bg-primary text-white"
                          : "bg-search-bg text-muted",
                      ].join(" ")}
                    >
                      <MaskIcon src="/sidebar/wallet.svg" className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {pack.credits.toLocaleString()} credits
                        </span>
                        {pack.popular ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-0.5 block text-xs text-muted">
                        {formatPrice(pack.priceBdt)} · one-time
                      </span>
                    </div>

                    <span
                      className={[
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-transparent",
                      ].join(" ")}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBuy}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Buy {selected.credits.toLocaleString()} · {formatPrice(selected.priceBdt)}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
