import { currentPlan, plans } from "./billing-data";
import { Check } from "lucide-react";

/** Compact current-plan summary — sits left of the plan picker. */
export function CurrentPlanCard() {
  const fullPlanDetails = plans.find((p) => p.id === currentPlan.id);

  return (
    <section className="flex h-full flex-col justify-between rounded-md bg-primary p-4 sm:p-5 text-white shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-white/80 uppercase">
            Current plan
          </p>
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {currentPlan.status}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          {currentPlan.name}
        </h2>
        <p className="mt-1 text-xs text-white/80">{currentPlan.seats}</p>

        {/* Plan Features List to fill the empty space nicely */}
        {fullPlanDetails && (
          <ul className="mt-5 flex flex-col gap-2.5 text-xs text-white/95">
            {fullPlanDetails.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold tracking-tight">
            {currentPlan.price}
          </p>
          <span className="text-sm font-medium text-white/80">
            / {currentPlan.period}
          </span>
        </div>
        <p className="mt-1 text-xs text-white/80">
          Renews {currentPlan.renewsOn}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-primary shadow-sm transition-opacity hover:opacity-90"
          >
            Upgrade plan
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center rounded-full text-sm font-semibold text-white border border-white/50 transition-colors hover:bg-black/20"
          >
            Cancel plan
          </button>
        </div>
      </div>
    </section>
  );
}
