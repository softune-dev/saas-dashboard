/**
 * Marketing/tracking connections — mirrors app/api/marketing.py exactly.
 *
 * REST surface (all under /sites/{site_id}/marketing):
 *   GET    /              → list connections for the site
 *   POST   /meta-capi      → connect (or replace) the Meta CAPI access token
 *   DELETE /{connection_id} → disconnect
 *
 * Only the CAPI access token lives here — client-side pixel IDs (Meta Pixel,
 * TikTok Pixel, GTM container) are non-secret and go through SiteSeo instead
 * (see site-settings.ts's tiktok_pixel/gtm_container_id fields).
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

export type MarketingProvider = "meta_capi";
export type MarketingConnectionStatus = "connected" | "error" | "disabled";

/** A saved marketing connection for one site. The token itself is never
 * returned — only a short masked suffix the merchant can recognize. */
export type MarketingConnectionOut = {
  id: string;
  site_id: string;
  provider: MarketingProvider;
  status: MarketingConnectionStatus;
  /** e.g. "••••••a1b2" — display only. */
  access_token_hint: string;
  created_at: string;
  updated_at: string;
};

/** Body for POST /sites/{site_id}/marketing/meta-capi */
export type MetaCapiConnectIn = {
  access_token: string;
};

/** GET /sites/{site_id}/marketing — every marketing connection for this site. */
export async function listMarketingConnections(
  siteId: string,
): Promise<MarketingConnectionOut[]> {
  return request<MarketingConnectionOut[]>(`/sites/${siteId}/marketing`);
}

export function useMarketingConnectionsSWR(
  siteId: string | null,
): SWRResponse<MarketingConnectionOut[]> {
  return useSWR(siteId ? [siteId, "marketing"] : null, ([id]) =>
    listMarketingConnections(id),
  );
}

/**
 * POST /sites/{site_id}/marketing/meta-capi
 * Stores the access token encrypted server-side. No verification call
 * exists (Meta has no simple "check this token" endpoint) — it's used the
 * next time a real order fires a Purchase event.
 */
export async function connectMetaCapi(
  siteId: string,
  data: MetaCapiConnectIn,
): Promise<MarketingConnectionOut> {
  return request<MarketingConnectionOut>(`/sites/${siteId}/marketing/meta-capi`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** DELETE /sites/{site_id}/marketing/{connection_id} */
export async function disconnectMarketing(
  siteId: string,
  connectionId: string,
): Promise<void> {
  await request<void>(`/sites/${siteId}/marketing/${connectionId}`, {
    method: "DELETE",
  });
}
