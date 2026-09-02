"use client";

import { Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { Category } from "@/components/categories/categories-data";
import type { Product } from "@/components/products/products-data";
import { productDisplayPrice } from "./catalog-utils";
import { EditorLabel } from "./editor-field";

/** Minimal shape the homepage Events picker needs — mapped from the real
 * EventOut in theme-editor-view.tsx, same "adapt to what the picker needs"
 * pattern as PickerCategory/PickerProduct. No status/description fields:
 * this picker only ever shows active events (settings.selectedEventIds
 * choosing among them), so there's nothing else to display. */
export type PickerEvent = {
  id: string;
  name: string;
  image: string;
  discountPercent: number;
};

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

/** Multi-select list for dashboard categories.
 *
 * `autoFillFromCatalog` mirrors a real storefront behavior: sections like
 * "categories" show every real category when nothing's been explicitly
 * picked (see each template's own CategoriesSection.tsx and its "empty
 * selection → show all real categories" fallback) — so an empty
 * selectedIds here does NOT mean "nothing showing on the storefront," it
 * means "showing everything, unfiltered." Without this flag the picker
 * looked empty even when the live site already had real categories
 * showing, which read as broken/manual-trigger-required. Leave this false
 * for sections that are genuinely curated-only with no such fallback (e.g.
 * Category Showcase — see its own component's explicit comment). */
export function CategoryPicker({
  selectedIds,
  options,
  onChange,
  autoFillFromCatalog = false,
}: {
  selectedIds: string[];
  options: Category[];
  onChange: (ids: string[]) => void;
  autoFillFromCatalog?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const explicitlySelected = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => options.find((o) => o.id === id) ?? null)
        .filter((o): o is Category => Boolean(o)),
    [selectedIds, options],
  );
  const showingAll = autoFillFromCatalog && explicitlySelected.length === 0 && options.length > 0;
  const selected = showingAll ? options : explicitlySelected;
  const available = options.filter((o) => !(selectedIds ?? []).includes(o.id));

  function remove(id: string) {
    // Removing while every category is showing implicitly (nothing
    // explicitly picked yet) has to first materialize that implicit "all"
    // into a real list — otherwise onChange([]) would just re-trigger the
    // same "show all" fallback and the removed category would reappear.
    const base = showingAll ? options.map((o) => o.id) : (selectedIds ?? []);
    onChange(base.filter((x) => x !== id));
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
          {showingAll ? `All ${selected.length}` : `${selected.length} selected`}
        </span>
      </div>

      {showingAll ? (
        <p className="rounded-xl bg-search-bg px-3 py-2 text-center text-[11px] text-muted">
          Showing every category from your catalog — remove any to customize.
        </p>
      ) : null}

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

/** Multi-select list for catalog products.
 *
 * `autoFillFromCatalog` mirrors FeatureProductsSection.tsx's own real
 * fallback (nothing selected → first 8 products from the catalog, since
 * Product.featured isn't a real backend field) — see CategoryPicker's own
 * doc comment for why this exists at all. */
export function ProductPicker({
  selectedIds,
  options,
  onChange,
  label = "Products on section",
  autoFillFromCatalog = false,
}: {
  selectedIds: string[];
  options: Product[];
  onChange: (ids: string[]) => void;
  label?: string;
  autoFillFromCatalog?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const explicitlySelected = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => options.find((o) => o.id === id) ?? null)
        .filter((o): o is Product => Boolean(o)),
    [selectedIds, options],
  );
  const autoFilled = useMemo(() => options.slice(0, 8), [options]);
  const showingAll = autoFillFromCatalog && explicitlySelected.length === 0 && autoFilled.length > 0;
  const selected = showingAll ? autoFilled : explicitlySelected;
  const available = options.filter((o) => !(selectedIds ?? []).includes(o.id));
  const filteredAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [available, query]);

  function remove(id: string) {
    // Same materialize-on-remove reasoning as CategoryPicker.remove.
    const base = showingAll ? autoFilled.map((o) => o.id) : (selectedIds ?? []);
    onChange(base.filter((x) => x !== id));
  }

  function add(id: string) {
    if ((selectedIds ?? []).includes(id)) return;
    onChange([...(selectedIds ?? []), id]);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <EditorLabel>{label}</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {showingAll ? `Showing ${selected.length}` : `${selected.length} selected`}
        </span>
      </div>

      {showingAll ? (
        <p className="rounded-xl bg-search-bg px-3 py-2 text-center text-[11px] text-muted">
          No products picked yet — showing your {selected.length} most recent. Remove any to customize.
        </p>
      ) : null}

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
          onClick={() => {
            setOpen((v) => !v);
            setQuery("");
          }}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add product
        </button>

        {open && available.length > 0 ? (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-border dark:border-transparent bg-surface">
            <div className="relative border-b border-border dark:border-transparent p-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-soft"
                strokeWidth={1.75}
              />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-8 w-full rounded-lg bg-search-bg pr-2.5 pl-8 text-xs text-foreground outline-none placeholder:text-muted-soft"
              />
            </div>
            <ul className="scrollbar-thin max-h-48 overflow-y-auto p-1.5">
              {filteredAvailable.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-muted-soft">
                  No products match &ldquo;{query}&rdquo;
                </li>
              ) : (
                filteredAvailable.map((product) => (
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
                ))
              )}
            </ul>
          </div>
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
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [options, query]);

  if (options.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No products yet — add some in Products first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-soft"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="h-9 w-full rounded-full border border-border bg-surface pr-3 pl-8 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-soft">
          No products match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((product) => {
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
      )}
    </div>
  );
}

const EVENTS_MAX = 3;

/** Multi-select for the homepage "Events" section — capped at exactly 3
 * (the storefront section only ever shows up to 3 cards). Deliberately no
 * autoFillFromCatalog-style fallback like CategoryPicker: an empty
 * selection here must render the section's real empty/skeleton state,
 * never "show every active event." */
export function EventPicker({
  selectedIds,
  options,
  onChange,
}: {
  selectedIds: string[];
  options: PickerEvent[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => options.find((o) => o.id === id) ?? null)
        .filter((o): o is PickerEvent => Boolean(o)),
    [selectedIds, options],
  );
  const available = options.filter((o) => !(selectedIds ?? []).includes(o.id));
  const atMax = selected.length >= EVENTS_MAX;

  function remove(id: string) {
    onChange((selectedIds ?? []).filter((x) => x !== id));
  }

  function add(id: string) {
    if (atMax || (selectedIds ?? []).includes(id)) return;
    onChange([...(selectedIds ?? []), id]);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <EditorLabel>Featured events</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {selected.length} of {EVENTS_MAX} selected
        </span>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl bg-search-bg px-3 py-4 text-center text-xs text-muted">
          No events selected — pick up to {EVENTS_MAX} from your Events page
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((event) => (
            <li key={event.id} className="flex items-center gap-2.5 rounded-xl bg-search-bg px-2.5 py-2">
              <Thumb src={event.image} alt={event.name} fallback={PLACEHOLDER} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{event.name}</p>
                <p className="truncate text-[11px] text-muted">{event.discountPercent}% off</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${event.name}`}
                onClick={() => remove(event.id)}
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
          disabled={atMax || available.length === 0}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          {atMax ? `${EVENTS_MAX} of ${EVENTS_MAX} selected` : "Add event"}
        </button>

        {open && !atMax && available.length > 0 ? (
          <ul className="scrollbar-thin absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-52 overflow-y-auto rounded-xl border border-border dark:border-transparent bg-surface p-1.5">
            {available.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => add(event.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-search-bg"
                >
                  <Thumb src={event.image} alt={event.name} fallback={PLACEHOLDER} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{event.name}</p>
                    <p className="text-[11px] text-muted">{event.discountPercent}% off</p>
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
