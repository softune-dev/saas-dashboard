"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { listInvoices } from "@/lib/api";
import { SWITCHABLE_PLANS, planById } from "./billing-data";
import { ContactSalesModal } from "./contact-sales-modal";

/** Compact current-plan summary — sits left of the plan picker. Reads the
 * tenant's real plan (me.tenant.plan) instead of a hardcoded mock. */
export function CurrentPlanCard() {
  const { me, loading } = useSession();
  const { t } = useLanguage();
  const currentPlanId = me?.tenant.plan ?? "demo";
  const plan = planById(currentPlanId);
  const isDemo = currentPlanId === "demo";
  const [upgradeTarget, setUpgradeTarget] = useState<typeof SWITCHABLE_PLANS[number] | null>(null);
  // Most recent invoice — items come back newest-first (see
  // app/api/billing.py's order_by), so [0] is the latest.
  const [latestInvoiceNumber, setLatestInvoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInvoices()
      .then((page) => {
        if (!cancelled) setLatestInvoiceNumber(page.items[0]?.invoice_number ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatestInvoiceNumber(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // First switchable plan above the current one, for the "Upgrade plan"
  // shortcut — Business has nothing above it, so that button just hides.
  const currentIndex = SWITCHABLE_PLANS.findIndex((p) => p.id === currentPlanId);
  const nextPlan = isDemo ? SWITCHABLE_PLANS[0] : SWITCHABLE_PLANS[currentIndex + 1];

  return (
    <section className="flex h-full flex-col justify-between rounded-md bg-primary p-4 sm:p-5 text-white shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-white/80 uppercase">
            {t("Current plan")}
          </p>
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {loading ? "…" : isDemo ? t("Trial") : t("Active")}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          {loading ? "…" : plan?.name ?? currentPlanId}
        </h2>
        <p className="mt-1 text-xs text-white/80">
          {isDemo ? t("Assigned by the Softunebd team") : t("1 store")}
        </p>
        {latestInvoiceNumber ? (
          <p className="mt-1 text-[11px] font-medium tracking-wide text-white/70">
            {t("Latest invoice")}: {latestInvoiceNumber}
          </p>
        ) : null}

        {plan ? (
          <ul className="mt-5 flex flex-col gap-2.5 text-xs text-white/95">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </div>
                <span>{t(feature)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold tracking-tight">
            {plan?.priceMonthly != null ? `৳${plan.priceMonthly.toLocaleString()}` : "—"}
          </p>
          {plan?.priceMonthly != null ? (
            <span className="text-sm font-medium text-white/80">{t("/ month")}</span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-white/80">
          {isDemo
            ? t("No billing — trial access")
            : t("Billed monthly, applied manually by our team")}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {nextPlan ? (
            <button
              type="button"
              onClick={() => setUpgradeTarget(nextPlan)}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary shadow-sm transition-opacity hover:opacity-90"
            >
              {isDemo ? t("Upgrade from trial") : `${t("Upgrade plan")} (${nextPlan.name})`}
            </button>
          ) : null}
          {!isDemo ? (
            <a
              href="mailto:support@softunebd.com?subject=Cancel%20my%20plan"
              className="inline-flex h-9 w-full items-center justify-center rounded-full text-sm font-semibold text-white border border-white/50 transition-colors hover:bg-black/20"
            >
              {t("Contact support to cancel")}
            </a>
          ) : null}
        </div>
      </div>

      <ContactSalesModal
        open={upgradeTarget !== null}
        targetPlan={upgradeTarget}
        currentPlanName={plan?.name ?? currentPlanId}
        onClose={() => setUpgradeTarget(null)}
      />
    </section>
  );
}
