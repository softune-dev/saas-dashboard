"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PageHeading } from "@/components/ui/page-heading";
import { BillingHistory } from "./billing-history";
import { CurrentPlanCard } from "./current-plan-card";
import { PlanCards } from "./plan-cards";

export function BillingView() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col gap-1">
        <PageHeading title={t("Billing")} />
      </div>

      {/* Current plan (compact, left) + plan cards (right) */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2.15fr)]">
        <CurrentPlanCard />
        <PlanCards />
      </div>

      <BillingHistory />
    </div>
  );
}
