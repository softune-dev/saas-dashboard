/**
 * Fraud blocklist — mirrors app/api/fraud.py exactly.
 *
 * REST surface (all under /sites/{site_id}/fraud/blocklist):
 *   GET    /            → list this site's blocked phone numbers
 *   POST   /            → add a number
 *   DELETE /{entry_id}  → remove a number
 *
 * Checkout rules (hold_first_high_value / flag_burst_orders / block_blocklist)
 * are NOT here — they live on the site itself (SiteOut.fraud_rules), read/
 * written through updateSite() in lib/api.ts, same as shipping/faqs/legal.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

export type FraudBlocklistEntry = {
  id: string;
  site_id: string;
  phone: string;
  note: string;
  created_at: string;
};

export async function listBlocklist(siteId: string): Promise<FraudBlocklistEntry[]> {
  return request<FraudBlocklistEntry[]>(`/sites/${siteId}/fraud/blocklist`);
}

export function useBlocklistSWR(siteId: string | null): SWRResponse<FraudBlocklistEntry[]> {
  return useSWR(siteId ? [siteId, "fraud-blocklist"] : null, ([id]) => listBlocklist(id));
}

export async function addToBlocklist(
  siteId: string,
  data: { phone: string; note?: string },
): Promise<FraudBlocklistEntry> {
  return request<FraudBlocklistEntry>(`/sites/${siteId}/fraud/blocklist`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeFromBlocklist(siteId: string, entryId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/fraud/blocklist/${entryId}`, { method: "DELETE" });
}
