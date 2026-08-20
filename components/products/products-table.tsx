"use client";

import { ImageOff, Pencil, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { MaskIcon } from "@/components/ui/mask-icon";
import { formatTaka } from "@/lib/format";
import type { CategoryOut, ProductOut } from "@/lib/api/commerce";
import type { ProductFilters } from "./product-filters";
import { ProductsFilterPanel } from "./products-filter-panel";

export function ProductsTable({
  products,
  categories,
  categoryById,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onSearch,
}: {
  products: ProductOut[];
  categories: CategoryOut[];
  categoryById: Map<string, CategoryOut>;
  filters: ProductFilters;
  onFiltersChange: (next: ProductFilters) => void;
  onEdit: (product: ProductOut) => void;
  onDelete: (product: ProductOut) => void;
  /** Debounced server-side search — the backend already indexes this
   * (see app/api/commerce.py's list_products `q` param), so search isn't
   * done client-side the way Categories' small unpaginated list can. */
  onSearch: (q: string) => void;
}) {
  const [query, setQuery] = useState("");

  const columns: TableColumn<ProductOut>[] = [
    {
      id: "details",
      header: "Product",
      cell: (row) => (
        <div className="flex items-center gap-3.5 py-0.5">
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg sm:size-[4.5rem]">
            {row.images[0]?.url ? (
              <Image
                src={row.images[0].url}
                alt={row.name}
                fill
                sizes="72px"
                className="object-cover"
              />
            ) : (
              <ImageOff className="size-5 text-muted-soft" strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{row.name}</p>
            <p className="truncate text-xs text-muted">
              {row.category_id
                ? (categoryById.get(row.category_id)?.name ?? "Uncategorized")
                : "Uncategorized"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sku",
      header: "SKU",
      cell: (row) => (
        <span className="text-muted">{row.sku || "—"}</span>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatTaka(row.price_cents / 100)}
          </span>
          {row.compare_at_cents ? (
            <span className="text-xs text-muted line-through">
              {formatTaka(row.compare_at_cents / 100)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      cell: (row) =>
        row.track_stock ? (
          <span
            className={[
              "font-medium tabular-nums",
              row.stock <= 0 ? "text-red-500" : "text-foreground",
            ].join(" ")}
          >
            {row.stock}
          </span>
        ) : (
          <span className="text-muted">Unlimited</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            row.is_active
              ? "bg-primary/10 text-primary"
              : "bg-search-bg text-muted",
          ].join(" ")}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <div className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => onEdit(row)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            onClick={() => onDelete(row)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-red-500"
          >
            <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          All Products
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search products..."
              className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
            />
          </div>
          <ProductsFilterPanel
            categories={categories}
            value={filters}
            onChange={onFiltersChange}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        rowKey={(row) => row.id}
        emptyMessage="No products match your search or filters"
      />
    </section>
  );
}
