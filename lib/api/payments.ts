/**
 * Payment method connections — mirrors app/api/payments.py exactly.
 *
 * REST surface (all under /sites/{site_id}/payments):
 *   GET    /                → list connections for the site
 *   POST   /{provider}      → connect/update one provider (upsert)
 *   DELETE /{connection_id} → disconnect
 *
 * cod/manual have no credentials — only `config` is used. Gateway providers
 * (bkash/nagad/sslcommerz/rocket) send api_key/secret_key, which the server
 * encrypts; only a masked hint ever comes back.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";
import type { PaymentProvider } from "@/components/payments/payment-data";

export type PaymentConnectionOut = {
  id: string;
  site_id: string;
  provider: PaymentProvider;
  status: "connected" | "error" | "disabled";
  label: string | null;
  config: {
    cod_fee_cents?: number;
    payment_number?: string;
    wallets?: ("bkash" | "nagad")[];
    merchant_id?: string;
  };
  api_key_hint: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentConnectIn = {
  label?: string;
  cod_fee_cents?: number;
  payment_number?: string;
  wallets?: ("bkash" | "nagad" | "rocket")[];
  merchant_id?: string;
  api_key?: string;
  secret_key?: string;
};

export async function listPaymentConnections(siteId: string): Promise<PaymentConnectionOut[]> {
  return request<PaymentConnectionOut[]>(`/sites/${siteId}/payments`);
}

export function usePaymentConnectionsSWR(
  siteId: string | null,
): SWRResponse<PaymentConnectionOut[]> {
  return useSWR(siteId ? [siteId, "payments"] : null, ([id]) => listPaymentConnections(id));
}

export async function connectPayment(
  siteId: string,
  provider: PaymentProvider,
  data: PaymentConnectIn,
): Promise<PaymentConnectionOut> {
  return request<PaymentConnectionOut>(`/sites/${siteId}/payments/${provider}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function disconnectPayment(siteId: string, connectionId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/payments/${connectionId}`, { method: "DELETE" });
}
