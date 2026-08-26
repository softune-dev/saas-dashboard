"use client";

import { ImagePlus, Plus, X } from "lucide-react";
import { useState } from "react";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { uploadProductImage } from "@/lib/api/commerce";
import type { ProductVariant, ProductVariantValue } from "@/lib/api/commerce";

type ProductVariantsEditorProps = {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  /** Product base price — used only when a value has an explicit price set,
   * to convert the absolute ৳ the merchant types into priceDeltaCents. */
  basePriceCents: number;
  /** Needed to upload a per-value image (e.g. a color swatch photo) through
   * the same product-image pipeline as the gallery. Image upload is hidden
   * entirely when there's no site yet (new, unsaved product). */
  siteId: string | null;
};

const DEFAULT_HEX = "#9CA3AF";

function centsToMajor(cents: number): string {
  return (cents / 100).toFixed(2);
}

function majorToCents(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Small pill toggle — same visual language as the Fraud Protection rule
 * switches, just compact enough to sit inline in a variant type's header row. */
function MiniSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-1.5"
    >
      <span
        className={[
          "relative h-5 w-8 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border dark:bg-white/15",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "left-3.5" : "left-0.5",
          ].join(" ")}
        />
      </span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </button>
  );
}

/** Variant editor: type → attribute values, each optionally a real picked
 * color (hex, not a guessed name-to-color lookup) and/or its own image —
 * both reflected on the storefront (see color-names.ts's removal and
 * ProductDetailClient.tsx in each template). Price only ever shows once a
 * type is explicitly marked "Priced" — no more blank "—" fields on types
 * that were never meant to change price at all. */
export function ProductVariantsEditor({
  variants,
  onChange,
  basePriceCents,
  siteId,
}: ProductVariantsEditorProps) {
  function addType() {
    onChange([...variants, { type: "", affectsPrice: false, isColor: false, values: [] }]);
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
              siteId={siteId}
              onChange={(next) => updateType(index, next)}
              onRemove={() => removeType(index)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No variants yet. Add types like Size or Color.
        </p>
      )}

      <button
        type="button"
        onClick={addType}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
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
  siteId,
  onChange,
  onRemove,
}: {
  variant: ProductVariant;
  basePriceCents: number;
  siteId: string | null;
  onChange: (next: ProductVariant) => void;
  onRemove: () => void;
}) {
  const [draftName, setDraftName] = useState("");
  const [draftHex, setDraftHex] = useState(DEFAULT_HEX);

  function addValue() {
    const value = draftName.trim();
    if (!value) return;
    if (variant.values.some((v) => v.value.toLowerCase() === value.toLowerCase())) {
      setDraftName("");
      return;
    }
    const newValue: ProductVariantValue = { value };
    if (variant.isColor) newValue.hex = draftHex;
    // Priced types always start a new value at the base price (never a
    // blank field) — a merchant only ever needs to CHANGE the number, never
    // guess what an empty box means.
    if (variant.affectsPrice) newValue.priceDeltaCents = 0;
    onChange({ ...variant, values: [...variant.values, newValue] });
    setDraftName("");
    setDraftHex(DEFAULT_HEX);
  }

  function removeValue(value: string) {
    onChange({ ...variant, values: variant.values.filter((v) => v.value !== value) });
  }

  function updateValue(value: string, patch: Partial<ProductVariantValue>) {
    onChange({
      ...variant,
      values: variant.values.map((v) => (v.value === value ? { ...v, ...patch } : v)),
    });
  }

  function toggleColor(isColor: boolean) {
    onChange({
      ...variant,
      isColor,
      // Turning Color off drops any hex already picked — a plain-text value
      // shouldn't silently keep a color no longer shown anywhere for it.
      values: isColor ? variant.values : variant.values.map(({ hex, ...rest }) => rest),
    });
  }

  function togglePriced(affectsPrice: boolean) {
    onChange({
      ...variant,
      affectsPrice,
      values: affectsPrice
        // Every existing value starts at base price the instant Priced
        // turns on — never a blank field the merchant has to guess about.
        ? variant.values.map((v) => ({ ...v, priceDeltaCents: v.priceDeltaCents ?? 0 }))
        : variant.values.map(({ priceDeltaCents, ...rest }) => rest),
    });
  }

  async function uploadValueImage(value: string, file: File) {
    if (!siteId) return;
    const uploaded = await uploadProductImage(siteId, file);
    updateValue(value, { image: uploaded.url });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-search-bg/70 p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={variant.type}
          onChange={(e) => onChange({ ...variant, type: e.target.value })}
          placeholder="Variant name (e.g. Size, Color)"
          className="h-9 min-w-0 flex-1 rounded-md border-0 bg-surface px-2.5 text-sm font-semibold text-foreground outline-none ring-1 ring-border dark:ring-transparent placeholder:text-muted-soft focus:ring-primary"
        />
        <MiniSwitch checked={!!variant.isColor} onChange={toggleColor} label="Color" />
        <MiniSwitch checked={variant.affectsPrice} onChange={togglePriced} label="Priced" />
        <button
          type="button"
          aria-label="Remove variant type"
          onClick={onRemove}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-red-500"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      {variant.values.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {variant.values.map((v) => (
            <li
              key={v.value}
              className="flex items-center gap-2 rounded-lg bg-surface p-2"
            >
              {variant.isColor ? (
                <label
                  title="Pick the real color"
                  className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: v.hex || DEFAULT_HEX }}
                >
                  <input
                    type="color"
                    value={v.hex || DEFAULT_HEX}
                    onChange={(e) => updateValue(v.value, { hex: e.target.value })}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              ) : null}

              {siteId ? (
                <MediaSourceMenu
                  siteId={siteId}
                  category="products"
                  onUploadFiles={(files) => {
                    if (files[0]) uploadValueImage(v.value, files[0]);
                  }}
                  onPickImages={(images) => {
                    if (images[0]) updateValue(v.value, { image: images[0].url });
                  }}
                >
                  {(open) => (
                    <button
                      type="button"
                      onClick={open}
                      title={v.image ? "Replace this value's image" : "Add an image for this value"}
                      className="group relative size-8 shrink-0 overflow-hidden rounded-md bg-search-bg ring-1 ring-border dark:ring-transparent"
                    >
                      {v.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.image} alt="" className="size-full object-cover" />
                      ) : (
                        <ImagePlus className="m-auto size-3.5 text-muted-soft" strokeWidth={1.5} />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <ImagePlus className="size-3.5 text-white" strokeWidth={1.75} />
                      </span>
                    </button>
                  )}
                </MediaSourceMenu>
              ) : null}

              <input
                value={v.value}
                onChange={(e) => updateValue(v.value, { value: e.target.value })}
                className="h-9 min-w-0 flex-1 rounded-md border-0 bg-search-bg px-2.5 text-sm text-foreground outline-none ring-1 ring-border dark:ring-transparent focus:ring-primary"
              />

              {variant.affectsPrice ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  aria-label={`Price for ${v.value}`}
                  value={centsToMajor(basePriceCents + (v.priceDeltaCents ?? 0))}
                  onChange={(e) =>
                    updateValue(v.value, {
                      priceDeltaCents: majorToCents(e.target.value) - basePriceCents,
                    })
                  }
                  className="h-9 w-24 shrink-0 rounded-md border-0 bg-search-bg px-2.5 text-right text-sm tabular-nums text-foreground outline-none ring-1 ring-border dark:ring-transparent focus:ring-primary"
                />
              ) : null}

              <button
                type="button"
                aria-label={`Remove ${v.value}`}
                onClick={() => removeValue(v.value)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-search-bg hover:text-red-500"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-1.5">
        {variant.isColor ? (
          <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-inset ring-black/10 ring-dashed" style={{ backgroundColor: draftHex }}>
            <input
              type="color"
              value={draftHex}
              onChange={(e) => setDraftHex(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        ) : null}
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={
            variant.isColor ? "Add color name (e.g. Navy) + Enter" : "Add attribute (e.g. Large) + Enter"
          }
          className="h-8 min-w-0 flex-1 rounded-md border-0 bg-surface/80 px-2.5 text-xs text-foreground outline-none ring-1 ring-dashed ring-border dark:ring-transparent placeholder:text-muted-soft focus:bg-surface focus:ring-primary"
        />
        <button
          type="button"
          onClick={addValue}
          aria-label="Add attribute"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
