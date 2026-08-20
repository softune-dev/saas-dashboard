"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { Category } from "@/components/categories/categories-data";
import type { Product } from "@/components/products/products-data";
import { productDisplayPrice } from "./catalog-utils";
import { EditorLabel } from "./editor-field";

function Thumb({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || fallback}
      alt={alt}
      className="size-10 shrink-0 rounded-lg object-cover bg-search-bg"
    />
  );
}

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#F4F4F5" width="80" height="80"/><circle cx="40" cy="32" r="12" fill="#D4D4D8"/><path d="M16 68c4-14 14-22 24-22s20 8 24 22" fill="#D4D4D8"/></svg>`,
  );

/** Multi-select list for dashboard categories */
export function CategoryPicker({
  selectedIds,
  options,
  onChange,
}: {
  selectedIds: string[];
  options: Category[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => options.find((o) => o.id === id) ?? null)
        .filter((o): o is Category => Boolean(o)),
    [selectedIds, options],
  );
  const available = options.filter((o) => !(selectedIds ?? []).includes(o.id));

  function remove(id: string) {
    onChange((selectedIds ?? []).filter((x) => x !== id));
  }

  function add(id: string) {
    if ((selectedIds ?? []).includes(id)) return;
    onChange([...(selectedIds ?? []), id]);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <EditorLabel>Categories on storefront</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {selected.length} selected
        </span>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl bg-search-bg px-3 py-4 text-center text-xs text-muted">
          No categories yet — add from your catalog
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2.5 rounded-xl bg-search-bg px-2.5 py-2"
            >
              <Thumb src={cat.image} alt={cat.name} fallback={PLACEHOLDER} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {cat.name}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {cat.products} products
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${cat.name}`}
                onClick={() => remove(cat.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={available.length === 0}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add category
        </button>

        {open && available.length > 0 ? (
          <ul className="scrollbar-thin absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-52 overflow-y-auto rounded-xl border border-border dark:border-transparent bg-surface p-1.5">
            {available.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => add(cat.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-search-bg"
                >
                  <Thumb src={cat.image} alt={cat.name} fallback={PLACEHOLDER} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {cat.products} products
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/** Multi-select list for catalog products */
export function ProductPicker({
  selectedIds,
  options,
  onChange,
  label = "Products on section",
}: {
  selectedIds: string[];
  options: Product[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => options.find((o) => o.id === id) ?? null)
        .filter((o): o is Product => Boolean(o)),
    [selectedIds, options],
  );
  const available = options.filter((o) => !(selectedIds ?? []).includes(o.id));

  function remove(id: string) {
    onChange((selectedIds ?? []).filter((x) => x !== id));
  }

  function add(id: string) {
    if ((selectedIds ?? []).includes(id)) return;
    onChange([...(selectedIds ?? []), id]);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <EditorLabel>{label}</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {selected.length} selected
        </span>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl bg-search-bg px-3 py-4 text-center text-xs text-muted">
          No products yet — pick from your catalog
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-2.5 rounded-xl bg-search-bg px-2.5 py-2"
            >
              <Thumb
                src={product.image}
                alt={product.name}
                fallback={PLACEHOLDER}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {product.category} · {productDisplayPrice(product)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${product.name}`}
                onClick={() => remove(product.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={available.length === 0}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add product
        </button>

        {open && available.length > 0 ? (
          <ul className="scrollbar-thin absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-56 overflow-y-auto rounded-xl border border-border dark:border-transparent bg-surface p-1.5">
            {available.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => add(product.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-search-bg"
                >
                  <Thumb
                    src={product.image}
                    alt={product.name}
                    fallback={PLACEHOLDER}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {product.category} · {productDisplayPrice(product)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/** Single product select for showcase / product-detail preview.
 * Full-width list (no nested card/container) — selection is the only control. */
export function ProductSinglePicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Product[];
  onChange: (id: string) => void;
}) {
  if (options.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No products yet — add some in Products first.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {options.map((product) => {
        const active = product.id === value;
        return (
          <li key={product.id} className="border-b border-border dark:border-transparent last:border-b-0">
            <button
              type="button"
              onClick={() => onChange(product.id)}
              className={[
                "flex w-full items-center gap-3 px-1 py-3 text-left transition-colors",
                active ? "bg-primary/5" : "hover:bg-search-bg/80",
              ].join(" ")}
            >
              <Thumb
                src={product.image}
                alt={product.name}
                fallback={PLACEHOLDER}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {product.category} · {productDisplayPrice(product)}
                </p>
              </div>
              {active ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
