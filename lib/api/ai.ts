/**
 * AI theme suggestions — mirrors app/api/ai.py.
 *
 * POST /sites/{site_id}/ai/suggest → returns a small patch of theme settings
 * (Colors/Brand fields only — see app/ai.py's ALLOWED_FIELDS). The caller
 * applies it via the editor's own onChange(patch); this call never writes
 * anything itself.
 */

import { request } from "../api";

export type AISuggestPatch = Partial<{
  siteName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  displayFont: string;
  bodyFont: string;
  buttonStyle: "Pill" | "Rounded" | "Square";
}>;

export async function suggestThemePatch(
  siteId: string,
  prompt: string,
): Promise<AISuggestPatch> {
  const res = await request<{ patch: AISuggestPatch }>(
    `/sites/${siteId}/ai/suggest`,
    { method: "POST", body: JSON.stringify({ prompt }) },
  );
  return res.patch;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type SetCategoriesAction = {
  type: "set_categories";
  categories: string[];
};

export type CreateProductAction = {
  type: "create_product";
  product: {
    name: string;
    price_cents?: number;
    category_name?: string;
    unit?: string;
    free_delivery?: boolean;
    delivery_charge_cents?: number | null;
    short_description?: string;
    description?: string;
    features?: { title: string; description: string }[];
    variants?: {
      type: string;
      affectsPrice: boolean;
      values: { value: string; priceDeltaCents?: number }[];
    }[];
  };
};

export type UpdateProductAction = {
  type: "update_product";
  product: {
    product_id?: string;
    product_name?: string;
    name?: string;
    price_cents?: number;
    compare_at_cents?: number;
    stock?: number;
    is_active?: boolean;
    category_name?: string;
    unit?: string;
    free_delivery?: boolean;
    delivery_charge_cents?: number | null;
    short_description?: string;
    description?: string;
    features?: { title: string; description: string }[];
    variants?: {
      type: string;
      affectsPrice: boolean;
      values: { value: string; priceDeltaCents?: number }[];
    }[];
  };
};

export type PendingAction = SetCategoriesAction | CreateProductAction | UpdateProductAction;

export type ChatResult = {
  reply: string;
  toolsUsed: string[];
  pendingAction: PendingAction | null;
};

/** Backend tool names (app/ai_tools.py) mapped to what a merchant sees in
 * the "what did it look up" trail — not the raw function identifier. */
export const TOOL_LABELS: Record<string, string> = {
  get_business_overview: "Store overview",
  list_products: "Product list",
  list_orders: "Order list",
  get_order: "Order lookup",
  get_sales_summary: "Sales summary",
  get_site_info: "Site settings",
};

/**
 * POST /ai/chat — the general assistant sidebar (ai-sidebar.tsx). Tenant-
 * scoped by the auth token only; it doesn't read or write any site's data,
 * so there's no site id to pass. `history` is the last few turns from the
 * sidebar's own localStorage conversation, replayed for context.
 */
export async function chatWithAssistant(
  message: string,
  history: ChatTurn[],
): Promise<ChatResult> {
  const res = await request<{
    reply: string;
    tools_used: string[];
    pending_action: PendingAction | null;
  }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, history: history.slice(-10) }),
  });
  return {
    reply: res.reply,
    toolsUsed: res.tools_used ?? [],
    pendingAction: res.pending_action ?? null,
  };
}

/**
 * Confirm endpoints — POST /ai/actions/*. The chat call above only ever
 * PROPOSES these (see app/ai_actions.py); nothing is written until the
 * merchant clicks Confirm in the chat UI and one of these fires.
 */
export async function confirmSetCategories(
  categories: string[],
): Promise<{ id: string; name: string; slug: string }[]> {
  const res = await request<{ categories: { id: string; name: string; slug: string }[] }>(
    "/ai/actions/set-categories",
    { method: "POST", body: JSON.stringify({ categories }) },
  );
  return res.categories;
}

export async function confirmCreateProduct(
  product: CreateProductAction["product"],
): Promise<{ id: string; name: string; slug: string }> {
  const res = await request<{ product: { id: string; name: string; slug: string } }>(
    "/ai/actions/create-product",
    { method: "POST", body: JSON.stringify({ product }) },
  );
  return res.product;
}

export async function confirmUpdateProduct(
  product: UpdateProductAction["product"],
): Promise<{ id: string; name: string; slug: string }> {
  const res = await request<{ product: { id: string; name: string; slug: string } }>(
    "/ai/actions/update-product",
    { method: "POST", body: JSON.stringify({ product }) },
  );
  return res.product;
}
