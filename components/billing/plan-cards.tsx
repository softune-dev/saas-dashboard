"use client";

import { Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { currentPlan, plans } from "./billing-data";

export function PlanCards() {
  const { toast } = useToast();

  return (
    <section className="h-full rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Plans</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan.id;

          return (
            <article
              key={plan.id}
              className={[
                "flex flex-col rounded-md border p-4",
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </h3>
                </div>
                {plan.popular ? (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-muted">
                  / {plan.period}
                </span>
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      strokeWidth={2.25}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  if (isCurrent) return;
                  toast({
                    title: "Plan switched",
                    description: `Your plan is now ${plan.name}.`,
                    variant: "success",
                  });
                }}
                className={[
                  "mt-5 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-opacity",
                  isCurrent
                    ? "bg-search-bg text-muted"
                    : "bg-primary text-white hover:opacity-90",
                ].join(" ")}
              >
                {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
