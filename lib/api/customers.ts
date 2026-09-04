/**
 * Customers — mirrors app/api/customers.py's shape exactly. There is no
 * createCustomer: a record is created implicitly the first time a phone
 * number places an order (see crud.get_or_create_customer on the backend),
 * never through a direct "add a customer" form here.
 */

import useSWR, { type SWRResponse } from "swr";
import { Page, request } from "../api";
import type { OrderOut } from "./commerce";

export type CustomerOut = {
  id: string;
  site_id: string;
  phone: string;
  name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

/** Rule-based, computed fresh on every read — see app/risk_score.py. */
export type RiskScore = {
  score: number;
  label: "Low" | "Medium" | "High";
  signals: {
    previous_orders: number;
    delivered: number;
    cancelled: number;
    delivery_success_rate: number | null;
    cod_orders: number;
    device_known: boolean | null;
    ip_blocklisted: boolean;
    has_open_duplicate_order: boolean;
    courier_history_available: boolean;
    confirmed_fraud_history: boolean;
  };
};

export type CustomerDetailOut = CustomerOut & {
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
  orders: OrderOut[];
  risk_score: RiskScore;
};

export type CustomerUpdate = {
  name?: string | null;
  email?: string | null;
};

export type ListCustomersParams = {
  limit?: number;
  offset?: number;
};

export async function listCustomers(
  siteId: string,
  params: ListCustomersParams = {},
): Promise<Page<CustomerOut>> {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<CustomerOut>>(`/sites/${siteId}/customers?${search.toString()}`);
}

export async function getCustomer(
  siteId: string,
  customerId: string,
): Promise<CustomerDetailOut> {
  return request<CustomerDetailOut>(`/sites/${siteId}/customers/${customerId}`);
}

export async function updateCustomer(
  siteId: string,
  customerId: string,
  data: CustomerUpdate,
): Promise<CustomerOut> {
  return request<CustomerOut>(`/sites/${siteId}/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function useCustomersSWR(
  siteId: string | null,
  params: ListCustomersParams = {},
): SWRResponse<Page<CustomerOut>> {
  const key = siteId ? [siteId, "customers", params.limit ?? 50, params.offset ?? 0] : null;
  return useSWR(key, () => listCustomers(siteId as string, params));
}
