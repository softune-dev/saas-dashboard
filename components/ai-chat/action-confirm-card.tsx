"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  confirmCreateProduct,
  confirmSetCategories,
  confirmUpdateProduct,
  type PendingAction,
} from "@/lib/api/ai";

const UPDATE_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  price_cents: "Price",
  compare_at_cents: "Compare-at price",
  stock: "Stock",
  is_active: "Active",
  category_name: "Category",
  unit: "Unit",
  free_delivery: "Free delivery",
  delivery_charge_cents: "Delivery charge",
  short_description: "Short description",
  description: "Description",
  features: "Feature highlights",
  variants: "Variants",
};

function formatUpdateValue(field: string, value: unknown): string {
  if (field === "price_cents" || field === "compare_at_cents" || field === "delivery_charge_cents") {
    return typeof value === "number" ? (value / 100).toFixed(2) : String(value);
  }
  if (field === "is_active") return value ? "Yes" : "No";
  if (field === "free_delivery") return value ? "Free" : "Charged";
  if (field === "features" && Array.isArray(value)) return `${value.length} item(s)`;
  if (field === "variants" && Array.isArray(value)) return `${value.length} type(s)`;
  return String(value);
}

/** Renders what app/ai.py proposed (set_categories / create_product /
 * update_product) as a compact review card. Nothing is written until
 * Confirm is clicked — this is the entire safety boundary for chat-driven
 * writes, so it deliberately never auto-runs on mount or on a timer. */
export function ActionConfirmCard({
  action,
  resolved,
  onResolve,
}: {
  action: PendingAction;
  resolved?: "confirmed" | "cancelled";
  onResolve: (outcome: "confirmed" | "cancelled", resultNote: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (resolved === "confirmed") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-[13px] text-emerald-700">
        <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
        Applied
      </div>
    );
  }
  if (resolved === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-search-bg/60 px-3 py-2 text-[13px] text-muted">
        <X className="size-3.5 shrink-0" strokeWidth={2.5} />
        Discarded
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      if (action.type === "set_categories") {
        const cats = await confirmSetCategories(action.categories);
        onResolve("confirmed", `Added ${cats.length} categories.`);
      } else if (action.type === "create_product") {
        const product = await confirmCreateProduct(action.product);
        onResolve("confirmed", `Created "${product.name}". Add photos on its edit page.`);
      } else {
        const product = await confirmUpdateProduct(action.product);
        onResolve("confirmed", `Updated "${product.name}".`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      {action.type === "set_categories" ? (
        <>
          <p className="text-[11px] font-medium text-muted">
            Replace categories with
          </p>
          <div className="flex flex-wrap gap-1.5">
            {action.categories.map((name) => (
              <span
                key={name}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        </>
      ) : action.type === "create_product" ? (
        <>
          <p className="text-[11px] font-medium text-muted">New product</p>
          <div className="flex flex-col gap-1 text-[13px] text-foreground">
            <span className="font-semibold">{action.product.name}</span>
            {action.product.price_cents != null ? (
              <span className="text-muted">
                {(action.product.price_cents / 100).toFixed(2)}
                {action.product.category_name ? ` · ${action.product.category_name}` : ""}
                {action.product.unit ? ` · per ${action.product.unit}` : ""}
              </span>
            ) : null}
            {action.product.variants?.length ? (
              <span className="text-muted">
                {action.product.variants.map((v) => `${v.type}: ${v.values.map((val) => val.value).join(", ")}`).join(" · ")}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="text-[11px] font-medium text-muted">
            Edit {action.product.product_name ?? "product"}
          </p>
          <ul className="flex flex-col gap-1">
            {Object.entries(action.product)
              .filter(([field]) => field !== "product_id" && field !== "product_name")
              .map(([field, value]) => (
                <li key={field} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="text-muted">{UPDATE_FIELD_LABELS[field] ?? field}</span>
                  <span className="truncate font-medium text-foreground">
                    {formatUpdateValue(field, value)}
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}

      {error ? <p className="text-[11px] text-red-500">{error}</p> : null}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" />
              Applying…
            </span>
          ) : (
            "Confirm"
          )}
        </button>
        <button
          type="button"
          onClick={() => onResolve("cancelled", "Discarded.")}
          disabled={loading}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
