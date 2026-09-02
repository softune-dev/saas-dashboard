"use client";

import { useSession } from "@/components/providers/session-provider";
import { trialDaysLeft } from "@/lib/format";

type TrialBadgeProps = {
  className?: string;
};

/**
 * Header countdown for self-serve trial tenants. Hidden for every other
 * plan — including demo/paid — so a non-trial merchant never sees it.
 */
export function TrialBadge({ className = "" }: TrialBadgeProps) {
  const { me } = useSession();
  const tenant = me?.tenant;
  if (!tenant || tenant.plan !== "trial") return null;

  const days = trialDaysLeft(tenant.trial_expires_at);
  const label =
    days <= 0
      ? "Trial · last day"
      : days === 1
        ? "Trial · 1 day left"
        : `Trial · ${days} days left`;

  return (
    <span
      className={[
        "inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border border-border/70 bg-surface px-3 text-xs font-semibold tracking-tight text-foreground",
        className,
      ].join(" ")}
      title={
        tenant.trial_expires_at
          ? `Trial ends ${new Date(tenant.trial_expires_at).toLocaleString()}`
          : "Trial"
      }
    >
      {label}
    </span>
  );
}
