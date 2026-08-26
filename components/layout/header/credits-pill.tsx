"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useAIUsageSWR } from "@/lib/api/ai";
import { CreditsTopupModal } from "./credits-topup-modal";

type CreditsPillProps = {
  className?: string;
  /** `stack` = header (label over count). `inline` = sidebar (one row). */
  layout?: "stack" | "inline";
};

/**
 * Real AI credits chip. Shows this tenant's daily remaining count
 * (see app/ai.py PLAN_AI_DAILY_CAP + get_usage).
 */
export function CreditsPill({
  className = "",
  layout = "stack",
}: CreditsPillProps) {
  const { data, isLoading } = useAIUsageSWR();
  const [topupOpen, setTopupOpen] = useState(false);

  // A 0-limit plan (Starter, today) has no credits to show at all — the
  // pill quietly doesn't render rather than showing a permanent "0".
  if (!isLoading && data && data.limit <= 0) return null;

  const remaining = data?.remaining;
  const limit = data?.limit;
  const low =
    typeof remaining === "number" &&
    typeof limit === "number" &&
    limit > 0 &&
    remaining / limit <= 0.15;
  const inline = layout === "inline";

  return (
    <>
      <div
        className={[
          "flex shrink-0 items-center rounded-full border border-border/70 bg-surface",
          inline ? "h-11 w-full gap-2.5 px-2.5 py-1.5" : "h-10 gap-2 py-1 pr-1 pl-1.5",
          className,
        ].join(" ")}
        aria-label={
          typeof remaining === "number"
            ? `${remaining} AI credits remaining today`
            : "AI credits"
        }
        title="Resets daily"
      >
        <span
          className={[
            "flex shrink-0 items-center justify-center rounded-full text-white",
            inline ? "size-8" : "size-7",
            low ? "bg-red-500" : "bg-primary",
          ].join(" ")}
        >
          <MaskIcon
            src="/sidebar/wallet.svg"
            className={inline ? "size-4" : "size-3.5"}
          />
        </span>

        {inline ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-foreground">
              AI Credits
            </span>
            <span className="text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {typeof remaining === "number" ? remaining.toLocaleString() : "—"}
              {typeof limit === "number" ? (
                <span className="font-medium text-muted-soft">/{limit}</span>
              ) : null}
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col justify-center leading-none">
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
        )}

        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          aria-label="Add credits"
          title="Add credits"
          className={[
            "ml-auto flex shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90",
            inline ? "size-7" : "size-6",
          ].join(" ")}
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
