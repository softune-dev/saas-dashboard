"use client";

import { useEffect, useRef, useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { CategoryOut } from "@/lib/api/commerce";
import {
  countActiveFilters,
  emptyProductFilters,
  type ProductFilters,
} from "./product-filters";

type ProductsFilterPanelProps = {
  categories: CategoryOut[];
  value: ProductFilters;
  onChange: (next: ProductFilters) => void;
};

/** Filter icon + popover: category, status, stock. Matches the circular
 * filter control used on other table toolbars. */
export function ProductsFilterPanel({
  categories,
  value,
  onChange,
}: ProductsFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectClass =
    "h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Filter products"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative inline-flex size-9 items-center justify-center rounded-full border text-foreground transition-colors",
          open || activeCount > 0
            ? "border-primary bg-primary/5 text-primary"
            : "border-border hover:border-slate-300",
        ].join(" ")}
      >
        <MaskIcon src="/sidebar/filter.svg" className="size-4" />
        {activeCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Product filters"
          className="absolute top-full right-0 z-30 mt-2 w-72 rounded-xl bg-surface p-4 shadow-lg ring-1 ring-slate-200/80"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Filters</p>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => onChange(emptyProductFilters)}
                className="text-xs font-medium text-primary hover:opacity-80"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Category</span>
              <select
                value={value.categoryId}
                onChange={(e) =>
                  onChange({ ...value, categoryId: e.target.value })
                }
                className={selectClass}
              >
                <option value="">All categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Status</span>
              <select
                value={value.status}
                onChange={(e) =>
                  onChange({
                    ...value,
                    status: e.target.value as ProductFilters["status"],
                  })
                }
                className={selectClass}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Stock</span>
              <select
                value={value.stock}
                onChange={(e) =>
                  onChange({
                    ...value,
                    stock: e.target.value as ProductFilters["stock"],
                  })
                }
                className={selectClass}
              >
                <option value="">All stock levels</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
