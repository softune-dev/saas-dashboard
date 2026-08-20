"use client";

import { useEffect, useState } from "react";
import { ONBOARDING_STEPS } from "./onboarding-steps";
import {
  ONBOARDING_PROGRESS_EVENT,
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
} from "./onboarding-types";

export type OnboardingSidebarProgress = {
  completed: number;
  total: number;
  allDone: boolean;
  /** e.g. "4/12" or "Done" for SidebarNavItem badgeLabel */
  badgeLabel: string;
};

function readProgress(): OnboardingSidebarProgress {
  const total = ONBOARDING_STEPS.length;
  if (typeof window === "undefined") {
    return { completed: 0, total, allDone: false, badgeLabel: `0/${total}` };
  }
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return { completed: 0, total, allDone: false, badgeLabel: `0/${total}` };
    }
    const state = JSON.parse(raw) as OnboardingState;
    const completed = new Set([
      ...(state.completedSteps ?? []),
      ...(state.skippedSteps ?? []),
    ]).size;
    const allDone = !!state.finishedAt;
    return {
      completed,
      total,
      allDone,
      badgeLabel: allDone ? "Done" : `${completed}/${total}`,
    };
  } catch {
    return { completed: 0, total, allDone: false, badgeLabel: `0/${total}` };
  }
}

/** Sidebar badge for Setup — tracks onboarding localStorage progress. */
export function useOnboardingSidebarProgress(): OnboardingSidebarProgress {
  const [progress, setProgress] = useState<OnboardingSidebarProgress>(readProgress);

  useEffect(() => {
    const refresh = () => setProgress(readProgress());
    refresh();
    window.addEventListener(ONBOARDING_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ONBOARDING_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return progress;
}
