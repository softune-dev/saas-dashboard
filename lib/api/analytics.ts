/**
 * Store analytics — mirrors app/api/analytics.py exactly. Real numbers
 * computed from Order/OrderItem/Product/Category/PageView. `visits` is
 * unique visitors (distinct session_id), from real page-load beacons the
 * storefront fires (see each template's PageViewBeacon component), not an
 * estimate.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

export type AnalyticsStat = {
  cents: number | null;
  count: number | null;
  percent: number | null;
  change_percent: number | null;
};

export type RevenueCurvePoint = {
  label: string;
  revenue_cents: number;
  orders: number;
};

export type CategoryShare = {
  name: string;
  revenue_cents: number;
  percent: number;
};

export type BestSeller = {
  id: string | null;
  name: string;
  category: string;
  image: string;
  sold: number;
  revenue_cents: number;
};

export type SalesReportRow = {
  period: string;
  orders: number;
  customers: number;
  revenue_cents: number;
  refunds_cents: number;
  net_cents: number;
};

export type AnalyticsOut = {
  currency: string;
  revenue: AnalyticsStat;
  orders: AnalyticsStat;
  aov: AnalyticsStat;
  refund_rate: AnalyticsStat;
  visits: AnalyticsStat;
  conversion_rate: AnalyticsStat;
  profit: AnalyticsStat;
  /** Share of current-period revenue that actually had a Cost Price set —
   * profit is computed only from items with a cost snapshot, so a low
   * number here means the profit figure is incomplete, not necessarily low. */
  cost_data_coverage_percent: number;
  revenue_curve: RevenueCurvePoint[];
  category_shares: CategoryShare[];
  best_sellers: BestSeller[];
  sales_report: SalesReportRow[];
};

export async function getAnalytics(
  siteId: string,
  weeks = 8,
): Promise<AnalyticsOut> {
  return request<AnalyticsOut>(`/sites/${siteId}/analytics?weeks=${weeks}`);
}

export function useAnalyticsSWR(
  siteId: string | null,
  weeks = 8,
): SWRResponse<AnalyticsOut> {
  return useSWR(siteId ? [siteId, "analytics", weeks] : null, ([id, , w]) =>
    getAnalytics(id, w),
  );
}
