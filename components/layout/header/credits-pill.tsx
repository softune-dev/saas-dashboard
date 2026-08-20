"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useAIUsageSWR } from "@/lib/api/ai";
import { CreditsTopupModal } from "./credits-topup-modal";

/**
 * Real AI credits chip — sits left of the action icons in the header.
 * Shows this tenant's actual daily remaining count (see app/ai.py's
 * PLAN_AI_DAILY_CAP + get_usage), not a mock number. The "+" opens a
 * top-up sheet; buying doesn't do anything yet since there's no real
 * purchase flow until billing ships (planned alongside superadmin).
 */
export function CreditsPill() {
  const { data, isLoading } = useAIUsageSWR();
  const [topupOpen, setTopupOpen] = useState(false);

  // A 0-limit plan (Starter, today) has no credits to show at all — the
  // pill quietly doesn't render rather than showing a permanent "0".
  if (!isLoading && data && data.limit <= 0) return null;

  const remaining = data?.remaining;
  const limit = data?.limit;
  const low = typeof remaining === "number" && typeof limit === "number" && limit > 0 && remaining / limit <= 0.15;

  return (
    <>
      <div
        className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-surface py-1 pr-1.5 pl-1.5"
        aria-label={
          typeof remaining === "number"
            ? `${remaining} AI credits remaining today`
            : "AI credits"
        }
        title="Resets daily"
      >
        <span
          className={[
            "flex size-7 shrink-0 items-center justify-center rounded-full text-white",
            low ? "bg-red-500" : "bg-primary",
          ].join(" ")}
        >
          <MaskIcon src="/sidebar/wallet.svg" className="size-3.5" />
        </span>

        <div className="flex min-w-0 flex-col justify-center leading-none">
          <span className="text-[10px] font-medium tracking-wide text-muted-soft uppercase">
            AI Credits
          </span>
          <span className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight text-foreground">
            {typeof remaining === "number" ? remaining.toLocaleString() : "—"}
            {typeof limit === "number" ? (
              <span className="font-normal text-muted-soft">/{limit}</span>
            ) : null}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          aria-label="Add credits"
          title="Add credits"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>

      <CreditsTopupModal
        open={topupOpen}
        balance={remaining ?? 0}
        onClose={() => setTopupOpen(false)}
      />
    </>
  );
}
