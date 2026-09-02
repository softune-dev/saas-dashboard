"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

/**
 * Routes unpublished tenants into /onboarding.
 *
 * Superadmins are exempt: their tenant has no sites at all (see
 * scripts that create them), and "no site" would otherwise read as
 * "needs onboarding" forever — bouncing them off every /superadmin/*
 * page back into a wizard that can't run for an internal ops account.
 *
 * Trial tenants are also exempt: a self-serve trial site starts as
 * draft (same as any newly provisioned site), but locking them out of
 * the dashboard until they publish would make the 3-day trial unusable.
 * /onboarding stays available as optional guidance.
 */
export function useOnboardingGuard() {
  const { currentSite, sites, loading, me } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const onOnboarding = pathname.startsWith("/onboarding");
  const isSuperadmin = me?.user.is_superadmin === true;
  const isTrial = me?.tenant.plan === "trial";

  useEffect(() => {
    if (loading || isSuperadmin || isTrial) return;

    const site = currentSite ?? sites[0] ?? null;
    const needsOnboarding = !site || site.status !== "published";

    if (needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (!needsOnboarding && onOnboarding) {
      router.replace("/");
    }
  }, [loading, isSuperadmin, isTrial, currentSite, sites, onOnboarding, router]);
}
