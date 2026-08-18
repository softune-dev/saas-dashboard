/**
 * Store analytics — mirrors app/api/analytics.py exactly. Real numbers
 * computed from Order/OrderItem/Product/Category; no traffic tracking
 * exists in this app, so there is no "conversion rate" field here — see
 * the backend module docstring for why that's an honest omission rather
 * than a placeholder.
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
