"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { ProductOut } from "@/lib/api/commerce";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#F4F4F5" width="80" height="80"/><circle cx="40" cy="32" r="12" fill="#D4D4D8"/><path d="M16 68c4-14 14-22 24-22s20 8 24 22" fill="#D4D4D8"/></svg>`,
  );

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      className="size-10 shrink-0 rounded-lg bg-search-bg object-cover"
    />
  );
}

/** Which products an Event's discount applies to. Copies entity-picker.tsx's
 * ProductPicker UI conventions (search, selected list, add dropdown) but
 * typed against the real ProductOut, and deliberately has no
 * "autoFillFromCatalog" fallback — an event's product list is always
 * explicit/curated, never an implicit "all products" default. */
export function EventProductPicker({
  selectedIds,
  options,
  onChange,
}: {
  selectedIds: string[];
  options: ProductOut[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => selectedIds.map((id) => options.find((o) => o.id === id)).filter((o): o is ProductOut => Boolean(o)),
    [selectedIds, options],
  );
  const available = options.filter((o) => !selectedIds.includes(o.id));
  const filteredAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p) => p.name.toLowerCase().includes(q));
  }, [available, query]);

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  function add(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted">{t("Products in this event")}</span>
        <span className="text-[11px] font-medium text-slate-400">{selected.length} {t("selected")}</span>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl bg-search-bg px-3 py-4 text-center text-xs text-muted">
          {t("No products yet — add from your catalog")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((product) => (
            <li key={product.id} className="flex items-center gap-2.5 rounded-xl bg-search-bg px-2.5 py-2">
              <Thumb src={product.images[0]?.url ?? ""} alt={product.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {formatPrice(product.price_cents, product.currency)}
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
          {t("Add product")}
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
                placeholder={t("Search products...")}
                className="h-8 w-full rounded-lg bg-search-bg pr-2.5 pl-8 text-xs text-foreground outline-none placeholder:text-muted-soft"
              />
            </div>
            <ul className="scrollbar-thin max-h-48 overflow-y-auto p-1.5">
              {filteredAvailable.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-muted-soft">
                  {t("No products match")} &ldquo;{query}&rdquo;
                </li>
              ) : (
                filteredAvailable.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => add(product.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-search-bg"
                    >
                      <Thumb src={product.images[0]?.url ?? ""} alt={product.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                        <p className="truncate text-[11px] text-muted">
                          {formatPrice(product.price_cents, product.currency)}
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
