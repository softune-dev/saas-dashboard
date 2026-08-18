"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { CreditsTopupModal } from "./credits-topup-modal";

/** Mock balance until billing/credits API is wired. */
const MOCK_CREDITS = 10;

/**
 * Compact credits chip — sits left of the action icons in the header.
 * Plus opens the top-up modal.
 */
export function CreditsPill() {
  const [topupOpen, setTopupOpen] = useState(false);

  return (
    <>
      <div
        className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-white py-1 pr-1 pl-1.5"
        aria-label={`${MOCK_CREDITS} credits remaining`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <MaskIcon src="/sidebar/wallet.svg" className="size-3.5" />
        </span>

        <div className="flex min-w-0 flex-col justify-center leading-none pr-1">
          <span className="text-[10px] font-medium tracking-wide text-muted-soft uppercase">
            Credits
          </span>
          <span className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight text-foreground">
            {MOCK_CREDITS.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          aria-label="Add credits"
          title="Add credits"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>

      <CreditsTopupModal
        open={topupOpen}
        balance={MOCK_CREDITS}
        onClose={() => setTopupOpen(false)}
      />
    </>
  );
}
