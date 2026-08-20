"use client";

import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { listAllSiteMedia, resolveSiteLogoUrl } from "@/lib/api";
import { useCategoriesSWR, useProductsSWR } from "@/lib/api/commerce";
import { useCourierConnectionsSWR } from "@/lib/api/courier";
import { usePaymentConnectionsSWR } from "@/lib/api/payments";
import {
  useSiteSettingsSWR,
  type SiteBusiness,
} from "@/lib/api/site-settings";
import {
  GETTING_STARTED_STEPS,
  GETTING_STARTED_TOTAL,
  type GettingStartedStepDef,
  type GettingStartedStepId,
} from "./getting-started-data";

export type GettingStartedStep = GettingStartedStepDef & { done: boolean };

function hasBusinessContact(business: SiteBusiness | Record<string, unknown> | undefined): boolean {
  if (!business) return false;
  const phone = typeof business.phone === "string" ? business.phone.trim() : "";
  const email = typeof business.email === "string" ? business.email.trim() : "";
  const address = business.address as SiteBusiness["address"] | undefined;
  const street = typeof address?.street === "string" ? address.street.trim() : "";
  const city = typeof address?.city === "string" ? address.city.trim() : "";
  return !!(phone || email || street || city);
}

/** Shared progress for the Getting Started page + sidebar badge. */
export function useGettingStartedProgress() {
  const { currentSite, loading: sessionLoading } = useSession();
  const siteId = currentSite?.id ?? null;

  const { data: productPage, isLoading: productsLoading } = useProductsSWR(
    siteId,
    { limit: 1 },
  );
  const { data: categories, isLoading: categoriesLoading } =
    useCategoriesSWR(siteId);
  const { data: payments, isLoading: paymentsLoading } =
    usePaymentConnectionsSWR(siteId);
  const { data: couriers, isLoading: couriersLoading } =
    useCourierConnectionsSWR(siteId);
  const { data: settings, isLoading: settingsLoading } =
    useSiteSettingsSWR(siteId);
  const { data: media, isLoading: mediaLoading } = useSWR(
    siteId ? [siteId, "media-all"] : null,
    ([id]) => listAllSiteMedia(id),
  );

  const loading =
    sessionLoading ||
    (!!siteId &&
      (productsLoading ||
        categoriesLoading ||
        paymentsLoading ||
        couriersLoading ||
        settingsLoading ||
        mediaLoading));

  const business =
    settings?.business ??
    (currentSite?.business as SiteBusiness | undefined) ??
    undefined;

  const doneById: Record<GettingStartedStepId, boolean> = {
    product: (productPage?.total ?? 0) > 0,
    category: (categories?.length ?? 0) > 0,
    branding:
      !!resolveSiteLogoUrl(currentSite) && hasBusinessContact(business),
    payment: (payments ?? []).some((c) => c.status === "connected"),
    shipping:
      (couriers ?? []).some((c) => c.status === "connected") ||
      (settings?.shipping?.locations?.length ?? 0) > 0,
    media: (media?.total_count ?? 0) > 0,
    faqs: (settings?.faqs?.length ?? 0) > 0,
    legal:
      !!settings?.legal?.privacy?.published ||
      !!settings?.legal?.terms?.published,
    publish: currentSite?.status === "published",
  };

  const steps: GettingStartedStep[] = GETTING_STARTED_STEPS.map((step) => ({
    ...step,
    done: doneById[step.id],
  }));

  const completed = steps.filter((s) => s.done).length;
  const total = GETTING_STARTED_TOTAL;
  const allDone = completed === total && !!siteId;

  return {
    steps,
    completed,
    total,
    allDone,
    loading,
    hasSite: !!currentSite,
    /** Sidebar fraction while the Getting Started group is visible. */
    badgeLabel: !siteId || allDone ? undefined : `${completed}/${total}`,
  };
}
