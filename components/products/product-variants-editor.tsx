"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { ProductVariant } from "@/lib/api/commerce";

type ProductVariantsEditorProps = {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  /** Product base price — used only when a value has an explicit price set,
   * to convert the absolute ৳ the merchant types into priceDeltaCents. */
  basePriceCents: number;
};

function centsToMajor(cents: number): string {
  return (cents / 100).toFixed(2);
}

function majorToCents(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Variant editor: name → attributes → optional price. Empty price means
 * this value has no price override; filling a price marks the type as
 * priced (affectsPrice). Backend shape unchanged. */
export function ProductVariantsEditor({
  variants,
  onChange,
  basePriceCents,
}: ProductVariantsEditorProps) {
  function addType() {
    onChange([...variants, { type: "", affectsPrice: false, values: [] }]);
  }

  function updateType(index: number, next: ProductVariant) {
    onChange(variants.map((v, i) => (i === index ? next : v)));
  }

  function removeType(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.length > 0 ? (
        <div className="flex flex-col gap-3">
          {variants.map((variant, index) => (
            <VariantTypeCard
              key={index}
              variant={variant}
              basePriceCents={basePriceCents}
              onChange={(next) => updateType(index, next)}
              onRemove={() => removeType(index)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No variants yet. Add types like Size or Weight.
        </p>
      )}

      <button
        type="button"
        onClick={addType}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-search-bg px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-border"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        Add type
      </button>
    </div>
  );
}

function VariantTypeCard({
  variant,
  basePriceCents,
  onChange,
  onRemove,
}: {
  variant: ProductVariant;
  basePriceCents: number;
  onChange: (next: ProductVariant) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");

  function addValue() {
    const value = draft.trim();
    if (!value) return;
    if (variant.values.some((v) => v.value.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    // No price by default — merchant fills Price only when this value costs
    // something different (or any price at all for priced types).
    onChange({
      ...variant,
      values: [...variant.values, { value }],
    });
    setDraft("");
  }

  function removeValue(value: string) {
    const values = variant.values.filter((v) => v.value !== value);
    onChange({
      ...variant,
      values,
      affectsPrice: values.some((v) => v.priceDeltaCents !== undefined),
    });
  }

  function renameValue(oldValue: string, name: string) {
    onChange({
      ...variant,
      values: variant.values.map((v) =>
        v.value === oldValue ? { ...v, value: name } : v,
      ),
    });
  }

  function setValuePrice(value: string, majorPrice: string) {
    if (majorPrice.trim() === "") {
      const values = variant.values.map((v) => {
        if (v.value !== value) return v;
        return { value: v.value };
      });
      onChange({
        ...variant,
        values,
        affectsPrice: values.some((v) => v.priceDeltaCents !== undefined),
      });
      return;
    }

    const absoluteCents = majorToCents(majorPrice);
    const delta = absoluteCents - basePriceCents;
    const values = variant.values.map((v) =>
      v.value === value ? { ...v, priceDeltaCents: delta } : v,
    );
    onChange({
      ...variant,
      values,
      affectsPrice: true,
    });
  }

  function priceInputValue(v: { priceDeltaCents?: number }): string {
    if (v.priceDeltaCents === undefined) return "";
    // Loaded types that never priced anything may still have 0 deltas.
    if (!variant.affectsPrice && v.priceDeltaCents === 0) return "";
    return centsToMajor(basePriceCents + v.priceDeltaCents);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-search-bg/70 p-4">
      <div className="flex items-center gap-2">
        <input
          value={variant.type}
          onChange={(e) => onChange({ ...variant, type: e.target.value })}
          placeholder="Variant name (e.g. Size)"
          className="h-9 min-w-0 flex-1 rounded-md border-0 bg-white px-2.5 text-sm font-semibold text-foreground outline-none ring-1 ring-slate-200/80 placeholder:text-muted-soft focus:ring-primary"
        />
        <button
          type="button"
          aria-label="Remove variant type"
          onClick={onRemove}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-red-500"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      {variant.values.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1fr_7.5rem_2rem] gap-2 px-0.5 text-[11px] font-medium text-muted-soft">
            <span>Attribute</span>
            <span>Price (৳)</span>
            <span />
          </div>
          {variant.values.map((v) => (
            <div
              key={v.value}
              className="grid grid-cols-[1fr_7.5rem_2rem] items-center gap-2"
            >
              <input
                value={v.value}
                onChange={(e) => renameValue(v.value, e.target.value)}
                className="h-9 min-w-0 rounded-md border-0 bg-white px-2.5 text-sm text-foreground outline-none ring-1 ring-slate-200/80 focus:ring-primary"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceInputValue(v)}
                onChange={(e) => setValuePrice(v.value, e.target.value)}
                placeholder="—"
                className="h-9 min-w-0 rounded-md border-0 bg-white px-2.5 text-right text-sm tabular-nums text-foreground outline-none ring-1 ring-slate-200/80 placeholder:text-muted-soft focus:ring-primary"
              />
              <button
                type="button"
                aria-label={`Remove ${v.value}`}
                onClick={() => removeValue(v.value)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-red-500"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder="Add attribute (e.g. Large) + Enter"
          className="h-8 min-w-0 flex-1 rounded-md border-0 bg-white/80 px-2.5 text-xs text-foreground outline-none ring-1 ring-dashed ring-slate-300 placeholder:text-muted-soft focus:bg-white focus:ring-primary"
        />
        <button
          type="button"
          onClick={addValue}
          aria-label="Add attribute"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-muted ring-1 ring-slate-200/80 transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
