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

export type CustomerDetailOut = CustomerOut & {
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
  orders: OrderOut[];
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
