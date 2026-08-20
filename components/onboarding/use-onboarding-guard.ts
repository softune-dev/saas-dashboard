"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

/**
 * Routes unpublished tenants into /onboarding.
 */
export function useOnboardingGuard() {
  const { currentSite, sites, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const onOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (loading) return;

    const site = currentSite ?? sites[0] ?? null;
    const needsOnboarding = !site || site.status !== "published";

    if (needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (!needsOnboarding && onOnboarding) {
      router.replace("/");
    }
  }, [loading, currentSite, sites, onOnboarding, router]);
}
