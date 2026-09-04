/**
 * Fraud protection — mirrors app/api/fraud.py exactly.
 *
 * REST surface (all under /sites/{site_id}/fraud):
 *   GET/POST   /blocklist              → phone blocklist (checked at checkout)
 *   DELETE     /blocklist/{entry_id}
 *   GET/POST   /ip-blocklist           → IP blocklist (checked on EVERY public request)
 *   DELETE     /ip-blocklist/{entry_id}
 *   GET        /suspicious-orders      → orders soft-flagged for review
 *   POST       /suspicious-orders/{order_id}/review
 *
 * Checkout rules (hold_first_high_value / flag_burst_orders / block_blocklist /
 * device_pending_lock / device_cooldown) are NOT here — they live on the site
 * itself (SiteOut.fraud_rules), read/written through updateSite() in
 * lib/api.ts, same as shipping/faqs/legal.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";
import type { OrderOut } from "./commerce";

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

// =============================================================================
//  IP blocklist — exact-IP match only (no CIDR, see FraudIpBlocklistEntryCreate
//  in app/schemas.py). Enforced on every /public/* request, not just checkout.
// =============================================================================

export type FraudIpBlocklistEntry = {
  id: string;
  site_id: string;
  ip_address: string;
  note: string;
  created_at: string;
};

export async function listIpBlocklist(siteId: string): Promise<FraudIpBlocklistEntry[]> {
  return request<FraudIpBlocklistEntry[]>(`/sites/${siteId}/fraud/ip-blocklist`);
}

export function useIpBlocklistSWR(siteId: string | null): SWRResponse<FraudIpBlocklistEntry[]> {
  return useSWR(siteId ? [siteId, "fraud-ip-blocklist"] : null, ([id]) => listIpBlocklist(id));
}

export async function addIpToBlocklist(
  siteId: string,
  data: { ip_address: string; note?: string },
): Promise<FraudIpBlocklistEntry> {
  return request<FraudIpBlocklistEntry>(`/sites/${siteId}/fraud/ip-blocklist`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeIpFromBlocklist(siteId: string, entryId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/fraud/ip-blocklist/${entryId}`, { method: "DELETE" });
}

// =============================================================================
//  Suspicious orders — soft-flagged by hold_first_high_value / flag_burst_orders
//  at checkout (app/fraud.py's evaluate_soft_flags). The order was already
//  created; this is a review queue, not a block. Immediate actions, NOT part
//  of the draft-then-Save flow the rest of this page uses — a review decision
//  is one-shot, not a setting to batch.
// =============================================================================

export async function listSuspiciousOrders(siteId: string): Promise<OrderOut[]> {
  return request<OrderOut[]>(`/sites/${siteId}/fraud/suspicious-orders`);
}

export function useSuspiciousOrdersSWR(siteId: string | null): SWRResponse<OrderOut[]> {
  return useSWR(siteId ? [siteId, "suspicious-orders"] : null, ([id]) =>
    listSuspiciousOrders(id),
  );
}

export async function reviewSuspiciousOrder(
  siteId: string,
  orderId: string,
  decision: "cleared" | "confirmed_fraud",
): Promise<OrderOut> {
  return request<OrderOut>(`/sites/${siteId}/fraud/suspicious-orders/${orderId}/review`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
