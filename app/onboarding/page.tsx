"use client";

import { OnboardingProvider, OnboardingView } from "@/components/onboarding";

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingView />
    </OnboardingProvider>
  );
}
