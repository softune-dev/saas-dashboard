"use client";

import { Plus, X } from "lucide-react";
import type { ProductFeature } from "@/lib/api/commerce";

type ProductFeaturesEditorProps = {
  features: ProductFeature[];
  onChange: (features: ProductFeature[]) => void;
};

const MAX_FEATURES = 8;

/** Title + short blurb pairs shown as icon callouts on the storefront
 * product page (e.g. "Free delivery — Worldwide shipping over ৳2,500").
 * Optional — the storefront section hides itself entirely when a product
 * has none, rather than falling back to invented commitments. */
export function ProductFeaturesEditor({
  features,
  onChange,
}: ProductFeaturesEditorProps) {
  function addFeature() {
    if (features.length >= MAX_FEATURES) return;
    onChange([...features, { title: "", description: "" }]);
  }

  function updateFeature(index: number, patch: Partial<ProductFeature>) {
    onChange(features.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFeature(index: number) {
    onChange(features.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {features.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-xl bg-search-bg/70 p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  value={feature.title}
                  onChange={(e) => updateFeature(index, { title: e.target.value })}
                  placeholder="Title (e.g. Free delivery)"
                  className="h-8 min-w-0 rounded-md border-0 bg-white px-2.5 text-sm font-medium text-foreground outline-none ring-1 ring-slate-200/80 placeholder:text-muted-soft focus:ring-primary"
                />
                <input
                  value={feature.description}
                  onChange={(e) =>
                    updateFeature(index, { description: e.target.value })
                  }
                  placeholder="Short description"
                  className="h-8 min-w-0 rounded-md border-0 bg-white px-2.5 text-xs text-foreground outline-none ring-1 ring-slate-200/80 placeholder:text-muted-soft focus:ring-primary"
                />
              </div>
              <button
                type="button"
                aria-label="Remove feature"
                onClick={() => removeFeature(index)}
                className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-red-500"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No feature highlights yet — optional callouts like &ldquo;Free
          delivery&rdquo; or &ldquo;Handmade&rdquo; shown on the product page.
        </p>
      )}

      {features.length < MAX_FEATURES ? (
        <button
          type="button"
          onClick={addFeature}
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-search-bg px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-border"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add feature
        </button>
      ) : null}
    </div>
  );
}
