"use client";

import { useEffect, useRef } from "react";
import { ONBOARDING_STEPS } from "./onboarding-steps";
import { useOnboarding } from "./onboarding-context";
import { StepNav } from "./step-nav";
import { StepShopBasics } from "./steps/step-shop-basics";
import { StepCategories } from "./steps/step-categories";
import { StepProducts } from "./steps/step-products";
import { StepCourier } from "./steps/step-courier";
import { StepPayments } from "./steps/step-payments";
import { StepSeo } from "./steps/step-seo";
import { StepStoreInfo } from "./steps/step-store-info";
import { StepFinish } from "./steps/step-finish";
import { StoreLiveModal } from "./store-live-modal";
import { OnboardingLottiePanel } from "./onboarding-lottie-panel";
import type { OnboardingStepId } from "./onboarding-steps";

const STEP_LOTTIE: Record<OnboardingStepId, string> = {
  shop: "/info.lottie",
  categories: "/category.lottie",
  products: "/category.lottie",
  courier: "/delivery.lottie",
  payments: "/payment.lottie",
  seo: "/seo.lottie",
  "store-info": "/shop.lottie",
  finish: "/live.lottie",
};

// Opt-in per step — most files are framed fine at their native size; these
// sit small/off-center in their own canvas and need a closer crop.
const STEP_LOTTIE_ZOOM: Partial<Record<OnboardingStepId, number>> = {
  payments: 1.6,
};

function StepBody() {
  const { step } = useOnboarding();
  switch (step.id) {
    case "shop":
      return <StepShopBasics />;
    case "categories":
      return <StepCategories />;
    case "products":
      return <StepProducts />;
    case "courier":
      return <StepCourier />;
    case "payments":
      return <StepPayments />;
    case "seo":
      return <StepSeo />;
    case "store-info":
      return <StepStoreInfo />;
    case "finish":
      return <StepFinish />;
    default:
      return null;
  }
}

export function OnboardingView() {
  const { state, step, stepIndex, dispatch } = useOnboarding();
  const doneCount = new Set([...state.completedSteps, ...state.skippedSteps]).size;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll step content to top on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [step.id]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <StoreLiveModal />

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto lg:overflow-hidden">
        <section className="flex h-auto w-full max-w-5xl min-w-0 flex-col overflow-visible rounded-md bg-surface lg:h-full lg:overflow-hidden">
          {/* Spans both columns below — same bar whether the step has a
              lottie panel showing or not, instead of only sitting above
              the form half. */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <h3 className="min-w-0 shrink-0 truncate text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden shrink-0 text-xs font-medium text-muted sm:inline">
                Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
              <ol className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-none">
                {ONBOARDING_STEPS.map((s, i) => {
                  const stepDone =
                    state.completedSteps.includes(s.id) || state.skippedSteps.includes(s.id);
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
                          "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                          active
                            ? "bg-primary text-white"
                            : stepDone
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
            </div>
          </div>
          <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
            <div className="relative hidden shrink-0 border-r border-border bg-surface lg:block lg:w-2/5">
              <OnboardingLottiePanel
                src={STEP_LOTTIE[step.id]}
                zoom={STEP_LOTTIE_ZOOM[step.id]}
              />
            </div>
            <div className="flex min-w-0 flex-col lg:flex-1 lg:overflow-hidden">
              <div ref={scrollRef} className="p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                <StepBody />
              </div>
              {/* Finish owns its own Publish button (real publish flow, with its
                  own loading/error state) — the generic Continue/Skip footer
                  would just be a second, conflicting way to leave this step. */}
              {step.id !== "finish" ? (
                <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
                  <StepNav />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
