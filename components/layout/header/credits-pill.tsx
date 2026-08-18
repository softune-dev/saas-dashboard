"use client";

import { MaskIcon } from "@/components/ui/mask-icon";
import { useAIUsageSWR } from "@/lib/api/ai";

/**
 * Real AI credits chip — sits left of the action icons in the header.
 * Shows this tenant's actual daily remaining count (see app/ai.py's
 * PLAN_AI_DAILY_CAP + get_usage), not a mock number.
 *
 * No "add credits" button yet on purpose — there's no real purchase flow
 * to send it to until billing exists (planned alongside superadmin). A
 * button that opened a fake top-up flow right next to a real usage count
 * would be actively misleading, not just an unfinished feature.
 */
export function CreditsPill() {
  const { data, isLoading } = useAIUsageSWR();

  // A 0-limit plan (Starter, today) has no credits to show at all — the
  // pill quietly doesn't render rather than showing a permanent "0".
  if (!isLoading && data && data.limit <= 0) return null;

  const remaining = data?.remaining;
  const limit = data?.limit;
  const low = typeof remaining === "number" && typeof limit === "number" && limit > 0 && remaining / limit <= 0.15;

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-white py-1 pr-2.5 pl-1.5"
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
    </div>
  );
}
