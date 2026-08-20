"use client";

import { useEffect, useRef } from "react";
import { ONBOARDING_STEPS } from "./onboarding-steps";
import { OnboardingProgress } from "./onboarding-progress";
import { useOnboarding } from "./onboarding-context";
import { StepNav } from "./step-nav";
import { StepShopBasics } from "./steps/step-shop-basics";
import { StepBrand } from "./steps/step-brand";
import { StepCategories } from "./steps/step-categories";
import { StepProducts } from "./steps/step-products";
import { StepCourier } from "./steps/step-courier";
import { StepPayments } from "./steps/step-payments";
import { StepSeo } from "./steps/step-seo";
import { StepStoreInfo } from "./steps/step-store-info";
import { StepFinish } from "./steps/step-finish";

function StepBody() {
  const { step } = useOnboarding();
  switch (step.id) {
    case "shop":
      return <StepShopBasics />;
    case "brand":
      return <StepBrand />;
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
  const { step, stepIndex } = useOnboarding();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll step content to top on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [step.id]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <OnboardingProgress />

      <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <section className="flex h-full w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-md bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h3 className="truncate text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <span className="shrink-0 text-xs font-medium text-muted sm:hidden">
              {stepIndex + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
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
        </section>
      </div>
    </div>
  );
}
