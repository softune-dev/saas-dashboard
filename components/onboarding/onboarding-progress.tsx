"use client";

import { MaskIcon } from "@/components/ui/mask-icon";
import { ONBOARDING_STEPS } from "./onboarding-steps";
import { useOnboarding } from "./onboarding-context";

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

export function OnboardingProgress() {
  const { state, stepIndex, dispatch } = useOnboarding();
  const doneCount = new Set([...state.completedSteps, ...state.skippedSteps]).size;
  const total = ONBOARDING_STEPS.length;
  const allDone = doneCount >= total - 1 && !!state.finishedAt;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <section className="flex flex-col gap-3 rounded-md bg-surface p-3.5 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <ProgressRing completed={doneCount} total={total} />

          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
              {allDone
                ? "Your shop is live"
                : `${doneCount} of ${total} steps complete`}
            </h2>
            <p className="text-xs text-muted truncate">
              Step {stepIndex + 1}: {ONBOARDING_STEPS[stepIndex]?.title}
            </p>
            {allDone ? (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <MaskIcon src="/sidebar/start.svg" className="size-3.5 text-primary" />
                All done
              </span>
            ) : null}
          </div>
        </div>

        <ol className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none sm:w-auto sm:shrink-0 sm:pb-0 sm:pt-0">
          {ONBOARDING_STEPS.map((s, i) => {
            const done =
              state.completedSteps.includes(s.id) ||
              state.skippedSteps.includes(s.id);
            const active = i === stepIndex;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  title={s.title}
                  onClick={() => {
                    if (i <= Math.max(stepIndex, doneCount)) {
                      dispatch({ type: "setStep", index: i });
                    }
                  }}
                  className={[
                    "flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-white"
                      : done
                        ? "bg-primary/15 text-primary"
                        : "bg-search-bg text-muted",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
