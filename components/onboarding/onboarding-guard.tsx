"use client";

import { Suspense, type ReactNode } from "react";
import { useOnboardingGuard } from "./use-onboarding-guard";

function GuardInner({ children }: { children: ReactNode }) {
  useOnboardingGuard();
  return <>{children}</>;
}

/** Runs the unpublished→/onboarding redirect after session is available. */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <GuardInner>{children}</GuardInner>
    </Suspense>
  );
}
