/**
 * Courier integrations — mirrors app/api/courier.py exactly.
 *
 * REST surface (all under /sites/{site_id}/couriers):
 *   GET    /                          → list connections for the site
 *   POST   /steadfast                 → connect Steadfast credentials
 *   DELETE /{connection_id}           → disconnect / revoke
 *   POST   /{connection_id}/verify    → re-check stored credentials
 *
 * Credentials are encrypted at rest server-side — the client only ever sees
 * masked hints after connect, never the raw secret again.
 */

import useSWR, { type SWRResponse } from "swr";
import { request, type Page } from "../api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Known BD courier providers shown in the dashboard catalog.
 * Only `steadfast` is first-wave for connect; others are UI placeholders
 * until their connect routes land.
 */
export type CourierProvider =
  | "steadfast"
  | "pathao"
  | "redx"
  | "paperfly"
  | "ecourier"
  | "sundarban"
  | "carrybee"
  | "sa_paribahan"
  | "pandago";

export type CourierConnectionStatus = "connected" | "error" | "disabled";

/**
 * A saved courier connection for one site. Secrets are never returned —
 * only a short masked suffix the merchant can recognize (e.g. last 4 of key).
 */
export type CourierConnectionOut = {
  id: string;
  site_id: string;
  provider: CourierProvider;
  status: CourierConnectionStatus;
  /** e.g. "••••••a1b2" — display only. */
  api_key_hint: string;
  /** Optional display name the merchant set; may be null. */
  label: string | null;
  /** When the credentials were last verified against the courier API. */
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Body for POST /sites/{site_id}/couriers/steadfast */
export type SteadfastConnectIn = {
  api_key: string;
  secret_key: string;
  /**
   * Optional override of Steadfast's API base URL (sandbox vs production).
   * Omit to use the platform default.
   */
  base_url?: string;
  label?: string;
};

/**
 * Pathao / RedX connect shapes — reserved for a later wave. Defined here so
 * the backend can add routes without renaming fields later.
 */
export type PathaoConnectIn = {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  label?: string;
};

export type RedxConnectIn = {
  api_key: string;
  label?: string;
};

// ---------------------------------------------------------------------------
// Client functions
// ---------------------------------------------------------------------------

/** GET /sites/{site_id}/couriers — every connection for this site. */
export async function listCourierConnections(
  siteId: string,
): Promise<CourierConnectionOut[]> {
  return request<CourierConnectionOut[]>(`/sites/${siteId}/couriers`);
}

/** Cached the same way useCategoriesSWR/useProductsSWR are (see commerce.ts)
 * — CourierView used to re-fetch this with a hand-rolled useEffect on every
 * mount, showing the loading skeleton on every visit even though nothing had
 * changed. SWR dedupes/caches by key so revisiting the page reads from cache
 * instantly instead of waiting on the network again. */
export function useCourierConnectionsSWR(
  siteId: string | null,
): SWRResponse<CourierConnectionOut[]> {
  return useSWR(siteId ? [siteId, "couriers"] : null, ([id]) =>
    listCourierConnections(id),
  );
}

/**
 * Paginated variant — the backend returns a plain array (like categories),
 * so this wraps it in a Page envelope client-side rather than hitting a
 * second route.
 */
export async function listCourierConnectionsPage(
  siteId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<Page<CourierConnectionOut>> {
  const items = await listCourierConnections(siteId);
  const offset = params.offset ?? 0;
  const limit = params.limit ?? items.length;
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}

/**
 * POST /sites/{site_id}/couriers/steadfast
 * Validates credentials against Steadfast server-side and stores them
 * encrypted either way — a bad key still creates a row with status "error"
 * so the merchant can see and fix it, rather than a failed request.
 * 409 if Steadfast is already connected for this site.
 */
export async function connectSteadfast(
  siteId: string,
  data: SteadfastConnectIn,
): Promise<CourierConnectionOut> {
  return request<CourierConnectionOut>(`/sites/${siteId}/couriers/steadfast`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * POST /sites/{site_id}/couriers/pathao — not implemented server-side yet.
 */
export async function connectPathao(
  _siteId: string,
  _data: PathaoConnectIn,
): Promise<CourierConnectionOut> {
  throw new Error("Pathao isn't connected yet — Steadfast is the only live provider.");
}

/**
 * POST /sites/{site_id}/couriers/redx — not implemented server-side yet.
 */
export async function connectRedx(
  _siteId: string,
  _data: RedxConnectIn,
): Promise<CourierConnectionOut> {
  throw new Error("RedX isn't connected yet — Steadfast is the only live provider.");
}

/**
 * DELETE /sites/{site_id}/couriers/{connection_id}
 * Revokes stored credentials. 404 cross-tenant (same rule as commerce).
 */
export async function disconnectCourier(
  siteId: string,
  connectionId: string,
): Promise<void> {
  await request<void>(`/sites/${siteId}/couriers/${connectionId}`, {
    method: "DELETE",
  });
}

/**
 * POST /sites/{site_id}/couriers/{connection_id}/verify
 * Re-hits the provider with stored creds, updates last_verified_at / status.
 */
export async function verifyCourierConnection(
  siteId: string,
  connectionId: string,
): Promise<CourierConnectionOut> {
  return request<CourierConnectionOut>(
    `/sites/${siteId}/couriers/${connectionId}/verify`,
    { method: "POST" },
  );
}
