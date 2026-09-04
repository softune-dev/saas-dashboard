"use client";

import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { ImportedProduct } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";

export function ImportedProductsView() {
  const { importedProducts } = useDropshipMock();

  const columns: TableColumn<ImportedProduct>[] = [
    {
      id: "product",
      header: "Product",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.productName}</p>
          <p className="truncate text-xs text-muted">Supplied by {row.supplierName}</p>
        </div>
      ),
    },
    {
      id: "wholesale",
      header: "Wholesale price",
      cell: (row) => (
        <span className="tabular-nums text-muted">
          {formatTaka(row.wholesalePriceCents / 100)}
        </span>
      ),
    },
    {
      id: "retail",
      header: "Your retail price",
      cell: (row) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatTaka(row.retailPriceCents / 100)}
        </span>
      ),
    },
    {
      id: "margin",
      header: "Your margin",
      cell: (row) => {
        const margin = row.retailPriceCents - row.wholesalePriceCents;
        return (
          <span className={`tabular-nums ${margin > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatTaka(margin / 100)}
          </span>
        );
      },
    },
    {
      id: "imported",
      header: "Imported",
      cell: (row) => (
        <span className="text-muted">{formatDisplayDate(new Date(row.importedAt))}</span>
      ),
    },
  ];

  return (
    <DropshipShell title="Imported Products">
      <p className="mb-4 text-sm text-muted">
        Products you&apos;ve brought in from other suppliers and are now selling on your own
        storefront. When a customer buys one, the supplier ships it — you never hold this
        inventory.
      </p>
      {importedProducts.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing imported yet"
          description="Browse Suppliers to bring a wholesale product into your own catalog."
        />
      ) : (
        <DataTable
          columns={columns}
          data={importedProducts}
          rowKey={(row) => row.id}
          emptyMessage="No imported products match this search."
          pageSize={10}
        />
      )}
    </DropshipShell>
  );
}
