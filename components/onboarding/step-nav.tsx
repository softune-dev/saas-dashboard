"use client";

import { PrimaryButton } from "@/components/ui/primary-button";
import { OutlineButton } from "@/components/ui/outline-button";
import { useOnboarding } from "./onboarding-context";

export function StepNav() {
  const { step, stepIndex, canContinueCurrent, continueOrSkip, dispatch } =
    useOnboarding();

  const isFinish = step.id === "finish";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <OutlineButton
        type="button"
        disabled={stepIndex === 0}
        onClick={() => dispatch({ type: "goBack" })}
        className="min-h-10 px-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-4" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </OutlineButton>

      <div className="flex flex-wrap items-center gap-2">
        {step.skippable ? (
          <OutlineButton
            type="button"
            onClick={() => continueOrSkip({ skip: true })}
            className="min-h-10 px-4"
          >
            Skip for now
          </OutlineButton>
        ) : null}
        <PrimaryButton
          type="button"
          disabled={!isFinish && !canContinueCurrent}
          onClick={() => continueOrSkip()}
          className="min-h-10 px-5"
        >
          {isFinish ? "Go live" : "Continue"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-4" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </PrimaryButton>
      </div>
    </div>
  );
}
