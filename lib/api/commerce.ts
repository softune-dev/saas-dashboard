/**
 * Categories, products, and orders — mirrors app/api/commerce.py's shape
 * exactly (field names, which lists paginate and which don't) rather than
 * inventing a friendlier client-side shape, so a schema change on the
 * backend is easy to diff against this file.
 */

import useSWR, { type SWRResponse } from "swr";
import { API_URL, getToken, Page, request } from "../api";

// ---------------------------------------------------------------------------
// Categories — GET is a plain array, not a Page envelope (backend doesn't
// paginate this one; see app/api/commerce.py list_categories).
// ---------------------------------------------------------------------------

export type CategoryOut = {
  id: string;
  site_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  /** Wide cover image for the shop page's per-category banner — separate
   * from image_url, which is the small thumbnail used in listings/cards. */
  banner_url: string | null;
  /** lucide-react icon name (e.g. "Truck") — only some templates render it. */
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type CategoryCreate = {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  banner_url?: string;
  icon?: string;
  parent_id?: string | null;
  sort_order?: number;
};

export type CategoryUpdate = Partial<CategoryCreate> & { is_active?: boolean };

export async function listCategories(siteId: string): Promise<CategoryOut[]> {
  return request<CategoryOut[]>(`/sites/${siteId}/categories`);
}

export async function createCategory(
  siteId: string,
  data: CategoryCreate,
): Promise<CategoryOut> {
  return request<CategoryOut>(`/sites/${siteId}/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  siteId: string,
  categoryId: string,
  data: CategoryUpdate,
): Promise<CategoryOut> {
  return request<CategoryOut>(`/sites/${siteId}/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Products under this category are NOT deleted — the backend sets their
 * category_id to null (see app/models.py's Category.parent_id ondelete). */
export async function deleteCategory(
  siteId: string,
  categoryId: string,
): Promise<void> {
  await request<void>(`/sites/${siteId}/categories/${categoryId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Events — sale/promo campaigns. GET paginates (Page<EventOut>) even though
// the per-tenant cap is small, mirroring app/api/events.py exactly.
// ---------------------------------------------------------------------------

export type EventOut = {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  cta_label: string;
  discount_percent: number;
  is_active: boolean;
  /** Not a real column — derived from the event's bound products, built by
   * app/api/events.py's _event_out(). */
  product_ids: string[];
  product_count: number;
  created_at: string;
};

export type EventCreate = {
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string;
  discount_percent: number;
  product_ids?: string[];
  is_active?: boolean;
};

export type EventUpdate = Partial<EventCreate>;

export async function listEvents(
  siteId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<Page<EventOut>> {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 100));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<EventOut>>(`/sites/${siteId}/events?${search.toString()}`);
}

export async function createEvent(siteId: string, data: EventCreate): Promise<EventOut> {
  return request<EventOut>(`/sites/${siteId}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  siteId: string,
  eventId: string,
  data: EventUpdate,
): Promise<EventOut> {
  return request<EventOut>(`/sites/${siteId}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Products bound to this event are NOT deleted — only the event_products
 * membership rows go (event_products.event_id is ON DELETE CASCADE, not
 * anything on the products table itself). */
export async function deleteEvent(siteId: string, eventId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/events/${eventId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Products — paginated (Page<ProductOut>).
// ---------------------------------------------------------------------------

/** One value within a variant type, e.g. {value: "500g", priceDeltaCents: 15000}.
 * priceDeltaCents only means anything (and is only sent) when the parent
 * type's affectsPrice is true — see app/products.py's validate_attributes,
 * which is the actual source of truth for this shape.
 *
 * hex is only meaningful when the parent type's isColor is true — a real
 * merchant-picked color, not a guess from the label text. image works on
 * ANY value regardless of isColor (e.g. a "Pattern" swatch benefits from
 * its own photo too) and is what lets the storefront swap the main product
 * photo when that value is selected. */
export type ProductVariantValue = {
  value: string;
  priceDeltaCents?: number;
  hex?: string;
  image?: string;
};

/** One variant type, e.g. "Size" (labels only), "Color" (isColor: real hex +
 * optional image per value), or "Weight" (priced). Stored under
 * ProductOut.attributes.variants — there is no separate variants table;
 * stock stays pooled per-product (see docs/TODO_PRODUCT_PAGE_REBUILD.md for
 * why). */
export type ProductVariant = {
  type: string;
  affectsPrice: boolean;
  isColor?: boolean;
  values: ProductVariantValue[];
};

export type ProductOut = {
  id: string;
  site_id: string;
  category_id: string | null;
  sku: string | null;
  name: string;
  slug: string;
  /** Sanitized HTML from the rich text editor — render with dangerouslySetInnerHTML
   * (already sanitized server-side... actually client-side on write, see
   * product-description-editor.tsx), never as plain text. */
  description: string | null;
  short_description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  /** Merchant's own cost basis — dashboard-only, powers real profit in
   * analytics. Never shown to customers on the storefront. */
  cost_price_cents: number | null;
  currency: string;
  stock: number;
  track_stock: boolean;
  images: { url: string; public_id?: string }[];
  attributes: Record<string, unknown> & { variants?: ProductVariant[] };
  is_active: boolean;
  video_url: string | null;
  serial_number: string | null;
  unit: string | null;
  /** Merchant-entered starting count, not a real sales figure — the storefront
   * adds real completed-order counts on top of this. */
  initial_sold_count: number;
  free_delivery: boolean;
  delivery_charge_cents: number | null;
  delivery_charges: ProductDeliveryCharge[];
  features: ProductFeature[];
  created_at: string;
};

export type ProductFeature = {
  title: string;
  description: string;
  /** lucide-react icon name (kebab-case) — same icon library/picker as
   * category icons. Undefined/null means not chosen yet; the storefront
   * falls back to a neutral default icon, never a guess from the title. */
  icon?: string | null;
};

/** One delivery-charge option offered for this product (e.g. "Inside Dhaka"
 * for ৳60) — a snapshot of one of the site's shipping locations (Site
 * Settings → Shipping) at the time it was added, not a live reference. */
export type ProductDeliveryCharge = {
  name: string;
  charge_cents: number;
};

export type ProductCreate = {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  price_cents: number;
  compare_at_cents?: number;
  cost_price_cents?: number;
  currency?: string;
  stock?: number;
  track_stock?: boolean;
  category_id?: string | null;
  images?: { url: string; public_id?: string }[];
  attributes?: Record<string, unknown>;
  video_url?: string;
  serial_number?: string;
  unit?: string;
  initial_sold_count?: number;
  free_delivery?: boolean;
  delivery_charge_cents?: number;
  delivery_charges?: ProductDeliveryCharge[];
  features?: ProductFeature[];
};

export type ProductUpdate = Partial<ProductCreate> & { is_active?: boolean };

export type ListProductsParams = {
  q?: string;
  category_id?: string;
  active_only?: boolean;
  limit?: number;
  offset?: number;
};

export async function listProducts(
  siteId: string,
  params: ListProductsParams = {},
): Promise<Page<ProductOut>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category_id) search.set("category_id", params.category_id);
  if (params.active_only !== undefined) {
    search.set("active_only", String(params.active_only));
  }
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<ProductOut>>(
    `/sites/${siteId}/products?${search.toString()}`,
  );
}

export async function createProduct(
  siteId: string,
  data: ProductCreate,
): Promise<ProductOut> {
  return request<ProductOut>(`/sites/${siteId}/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProduct(
  siteId: string,
  productId: string,
): Promise<ProductOut> {
  return request<ProductOut>(`/sites/${siteId}/products/${productId}`);
}

export async function updateProduct(
  siteId: string,
  productId: string,
  data: ProductUpdate,
): Promise<ProductOut> {
  return request<ProductOut>(`/sites/${siteId}/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(
  siteId: string,
  productId: string,
): Promise<void> {
  await request<void>(`/sites/${siteId}/products/${productId}`, {
    method: "DELETE",
  });
}

/** Multipart upload straight into a product's `images` field's Cloudinary
 * category — bypasses the JSON request() helper like uploadSiteMedia does,
 * for the same multipart-boundary reason. */
export async function uploadProductImage(
  siteId: string,
  file: File,
): Promise<{ url: string; public_id: string }> {
  const token = getToken();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(
    `${API_URL}/sites/${siteId}/media?category=products`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

/** Same shape as uploadProductImage but hits POST /media/video
 * (resource_type=video server-side — see app/api/media.py). */
export async function uploadProductVideo(
  siteId: string,
  file: File,
): Promise<{ url: string; public_id: string }> {
  const token = getToken();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(
    `${API_URL}/sites/${siteId}/media/video?category=products`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Orders — paginated (Page<OrderOut>). Creation is normally the storefront
// checkout's job — createOrder below exists for the one dashboard exception,
// the New Sale / POS screen (components/pos/new-sale-page.tsx), which is a
// merchant manually entering a walk-in sale against the same catalog/stock.
// The backend has no delete endpoint at all — order history is immutable
// by design (see CLAUDE.md rule 8).
// ---------------------------------------------------------------------------

export type OrderItemOut = {
  id: string;
  product_id: string | null;
  name_snapshot: string;
  sku_snapshot: string | null;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";

/** "storefront" = a real customer checkout. "pos" = a merchant-entered
 * walk-in sale from the New Sale screen. See migrations/038_order_channel.sql. */
export type OrderChannel = "storefront" | "pos";

export type OrderOut = {
  id: string;
  site_id: string;
  order_number: string;
  customer: Record<string, unknown> | null;
  /** Linked Customer record — null for orders placed before customers
   * shipped, or with no usable phone number. See lib/api/customers.ts. */
  customer_id: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  notes: string | null;
  /** payment_method / delivery_location / transaction_id — see
   * app/api/public.py's create_public_order. transaction_id is only present
   * for manual-payment orders. */
  meta: {
    payment_method?: string;
    delivery_location?: string | null;
    transaction_id?: string | null;
  } | null;
  items: OrderItemOut[];
  /** Older rows may omit this until backfilled — treat missing as storefront. */
  channel?: OrderChannel | null;
  /** Client-generated token from the storefront's checkout — see
   * templates/*\/lib/device.ts. Null for POS orders and any order placed
   * before this shipped. See app/fraud.py for how it's used. */
  device_id: string | null;
  /** clear | flagged | cleared | confirmed_fraud — see
   * dashboard/components/fraud/suspicious-orders-table.tsx. */
  fraud_status: "clear" | "flagged" | "cleared" | "confirmed_fraud";
  fraud_reason: string | null;
  /** Requesting IP at checkout — the only place a merchant can discover
   * which address to add to the fraud IP blocklist (Settings -> Fraud
   * Protection). Null for POS orders and orders placed before this shipped. */
  ip_address: string | null;
  created_at: string;
};

export type OrderCreateItem = {
  product_id: string;
  quantity: number;
};

/** Body for POST /sites/{site_id}/orders — currently only used by the New
 * Sale (POS) screen; a real customer checkout goes through
 * lib/checkout.ts's submitOrder against the public storefront API instead. */
export type OrderCreate = {
  customer?: Record<string, unknown>;
  items: OrderCreateItem[];
  shipping_cents?: number;
  tax_cents?: number;
  notes?: string;
  meta?: Record<string, unknown>;
  channel?: OrderChannel;
};

export async function createOrder(
  siteId: string,
  data: OrderCreate,
): Promise<OrderOut> {
  return request<OrderOut>(`/sites/${siteId}/orders`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type ListOrdersParams = {
  status?: OrderStatus;
  /** Matches order_number or customer JSON (name/email/phone). */
  q?: string;
  limit?: number;
  offset?: number;
};

export async function listOrders(
  siteId: string,
  params: ListOrdersParams = {},
): Promise<Page<OrderOut>> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<OrderOut>>(
    `/sites/${siteId}/orders?${search.toString()}`,
  );
}

export async function getOrder(
  siteId: string,
  orderId: string,
): Promise<OrderOut> {
  return request<OrderOut>(`/sites/${siteId}/orders/${orderId}`);
}

export async function updateOrderStatus(
  siteId: string,
  orderId: string,
  status: OrderStatus,
): Promise<OrderOut> {
  return request<OrderOut>(`/sites/${siteId}/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// SWR hooks — thin caching wrappers over the fetchers above.
//
// WHY: every page previously called its own list function inside a manual
// useCallback+useEffect, so navigating Categories -> Products -> Categories
// re-fetched from Postgres every single time, which is what made page
// navigation feel slow (see Providers' SWRConfig comment for the full
// picture). These hooks give each resource a stable cache key; a page
// revisited this session renders instantly from cache and revalidates
// quietly in the background instead of blocking on a spinner.
//
// Orders is the biggest win: Orders, Dashboard, and Customers all fetch the
// exact same `listOrders(siteId, { limit: 100 })` independently today. Using
// the same key here means only the FIRST of those three pages visited in a
// session pays the round-trip; the other two read from cache immediately.
// ---------------------------------------------------------------------------

export function useCategoriesSWR(siteId: string | null): SWRResponse<CategoryOut[]> {
  return useSWR(siteId ? [siteId, "categories"] : null, ([id]) => listCategories(id));
}

export function useEventsSWR(siteId: string | null): SWRResponse<Page<EventOut>> {
  return useSWR(siteId ? [siteId, "events"] : null, ([id]) => listEvents(id));
}

export function useProductsSWR(
  siteId: string | null,
  params: ListProductsParams = {},
): SWRResponse<Page<ProductOut>> {
  const key = siteId
    ? [siteId, "products", params.q ?? "", params.category_id ?? "", params.active_only ?? "", params.limit ?? 50, params.offset ?? 0]
    : null;
  return useSWR(key, () => listProducts(siteId as string, params));
}

export function useOrdersSWR(
  siteId: string | null,
  params: ListOrdersParams = {},
): SWRResponse<Page<OrderOut>> {
  const key = siteId
    ? [
        siteId,
        "orders",
        params.status ?? "",
        params.q ?? "",
        params.limit ?? 50,
        params.offset ?? 0,
      ]
    : null;
  return useSWR(key, () => listOrders(siteId as string, params));
}
