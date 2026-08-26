/**
 * AI theme suggestions — mirrors app/api/ai.py.
 *
 * POST /sites/{site_id}/ai/suggest → returns a small patch of theme settings
 * (Colors/Brand fields only — see app/ai.py's ALLOWED_FIELDS). The caller
 * applies it via the editor's own onChange(patch); this call never writes
 * anything itself.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

/** Shared SWR key — both the chat sidebar and the theme editor's "Ask AI"
 * box mutate this exact key after a successful call, so the header's
 * credits pill updates immediately instead of waiting for its own poll. */
export const AI_USAGE_SWR_KEY = "ai-usage";

export type AIUsage = {
  used: number;
  limit: number;
  remaining: number;
};

/** Read-only — does not itself count as AI usage. See app/ai.py's
 * get_usage docstring for why that distinction is load-bearing. */
export async function getAIUsage(): Promise<AIUsage> {
  return request<AIUsage>("/ai/usage");
}

export function useAIUsageSWR(): SWRResponse<AIUsage> {
  // Light polling as a safety net (usage can change from other tabs/devices
  // too, not just this one) — the real-time feel mostly comes from the
  // explicit mutate() calls right after a suggest/chat call succeeds.
  return useSWR(AI_USAGE_SWR_KEY, getAIUsage, { refreshInterval: 60000 });
}

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

/** Every field a "Generate"/"Regenerate" button can drive — mirrors
 * app/ai.py's _TEXT_PROMPTS keys exactly. */
export type GenerateTextKind =
  | "product_short_description"
  | "product_description"
  | "category_description"
  | "site_meta_description"
  | "site_og_description"
  | "site_about_paragraph";

/**
 * POST /ai/generate-text — real copywriting, not a settings patch. `context`
 * is whatever the merchant already typed elsewhere in the same form (product
 * name/category/price, site name, etc.); the backend refuses to generate
 * without the one field each kind actually needs (see app/ai.py's
 * _TEXT_REQUIRED_CONTEXT) so the AI never invents a product/store out of
 * nothing. `currentText`, when non-empty, asks the model to improve the
 * existing draft instead of overwriting it from scratch.
 */
export async function generateAiText(
  kind: GenerateTextKind,
  context: Record<string, unknown>,
  currentText?: string,
): Promise<string> {
  const res = await request<{ text: string }>("/ai/generate-text", {
    method: "POST",
    body: JSON.stringify({ kind, context, current_text: currentText || undefined }),
  });
  return res.text;
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

export type CreateTicketAction = {
  type: "create_ticket";
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  message: string;
};

export type PendingAction =
  | SetCategoriesAction
  | CreateProductAction
  | UpdateProductAction
  | CreateTicketAction;

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
  get_media_stats: "Media storage",
  get_billing_status: "Billing & usage",
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

export async function confirmCreateTicket(
  ticket: Omit<CreateTicketAction, "type">,
): Promise<{ id: string; subject: string; category: string; priority: string; status: string }> {
  const res = await request<{
    ticket: { id: string; subject: string; category: string; priority: string; status: string };
  }>("/ai/actions/create-ticket", { method: "POST", body: JSON.stringify(ticket) });
  return res.ticket;
}
