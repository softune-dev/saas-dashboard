"use client";

import { Check, Lightbulb } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { ONBOARDING_STEPS, type OnboardingStepId } from "./onboarding-steps";
import { useOnboarding } from "./onboarding-context";

// One line each, on purpose — this sits pinned at the bottom of a narrow
// sidebar, not a place for real guidance copy (each step's own body
// already has room for that).
const STEP_TIPS: Record<OnboardingStepId, string> = {
  shop: "A clear name and logo build trust fast.",
  brand: "Pick colors and fonts that match your brand.",
  categories: "Add a few categories so products have a home.",
  products: "3+ products with photos make a stronger first impression.",
  courier: "Connect a courier so orders can actually leave your shop.",
  payments: "Add at least one way customers can pay you.",
  seo: "A good title and description help you get found on Google.",
  "store-info": "Contact info and policies make shoppers feel safe buying.",
  finish: "Review everything below, then publish when you're ready.",
};

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const offset = c * (1 - pct);

  return (
    <span
      className="relative flex size-14 shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-foreground">
        {completed}/{total}
      </span>
    </span>
  );
}

/** Vertical sidebar, same height as the step card beside it — was a
 * horizontal bar sitting above the card; moved here so the two read as one
 * connected layout (sidebar + card, both full height) instead of a header
 * strip floating over an unrelated box below it. */
export function OnboardingProgress() {
  const { state, stepIndex, dispatch } = useOnboarding();
  const doneCount = new Set([...state.completedSteps, ...state.skippedSteps]).size;
  const total = ONBOARDING_STEPS.length;
  const allDone = doneCount >= total - 1 && !!state.finishedAt;

  const tip = STEP_TIPS[ONBOARDING_STEPS[stepIndex]?.id ?? "shop"];

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-md bg-surface lg:h-full lg:w-56">
      <div className="flex shrink-0 items-center gap-3 p-4 lg:pb-0">
        <ProgressRing completed={doneCount} total={total} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {allDone ? "Your shop is live" : `${doneCount} of ${total} steps`}
          </h2>
          {allDone ? (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <MaskIcon src="/sidebar/start.svg" className="size-3 text-primary" />
              All done
            </span>
          ) : (
            <p className="truncate text-xs text-muted">
              Step {stepIndex + 1}: {ONBOARDING_STEPS[stepIndex]?.title}
            </p>
          )}
        </div>
      </div>

      {/* Full step list + tip — only at lg+, where there's a tall sidebar
          to put them in. On smaller screens this whole thing is just the
          compact ring+title strip above, sitting on top of the form. */}
      <ol className="mt-4 hidden min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 pt-0 lg:flex">
        {ONBOARDING_STEPS.map((s, i) => {
          const done =
            state.completedSteps.includes(s.id) || state.skippedSteps.includes(s.id);
          const active = i === stepIndex;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  if (i <= Math.max(stepIndex, doneCount)) {
                    dispatch({ type: "setStep", index: i });
                  }
                }}
                className={[
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : done
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted hover:bg-search-bg",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : done
                        ? "bg-primary/15 text-primary"
                        : "bg-search-bg text-muted",
                  ].join(" ")}
                >
                  {done && !active ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="hidden shrink-0 border-t border-border p-3 lg:block">
        <div className="flex items-start gap-2 rounded-md bg-primary/5 px-2.5 py-2">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2} />
          <p className="text-xs leading-snug text-muted">{tip}</p>
        </div>
      </div>
    </aside>
  );
}
