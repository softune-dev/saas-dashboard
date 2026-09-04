"use client";

import { ImageOff, PackageSearch } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatTaka } from "@/lib/format";
import type { SupplierListing } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";
import { ImportProductModal } from "./import-product-modal";

export function BrowseSuppliersView() {
  const { marketplace, importedProducts, importProduct } = useDropshipMock();
  const { toast } = useToast();
  const [importing, setImporting] = useState<SupplierListing | null>(null);

  const importedListingIds = new Set(importedProducts.map((p) => p.listingId));

  function handleImport(retailPriceCents: number) {
    if (!importing) return;
    importProduct(importing, retailPriceCents);
    toast({ title: `${importing.productName} added to your catalog`, variant: "success" });
    setImporting(null);
  }

  const columns: TableColumn<SupplierListing>[] = [
    {
      id: "product",
      header: "Product",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg">
            <ImageOff className="size-4 text-muted-soft" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.productName}</p>
            <p className="truncate text-xs text-muted">{row.supplierName}</p>
          </div>
        </div>
      ),
    },
    {
      id: "wholesale",
      header: "Wholesale price",
      cell: (row) => (
        <span className="tabular-nums text-foreground">
          {formatTaka(row.wholesalePriceCents / 100)}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      cell: (row) =>
        row.stock > 0 ? (
          <span className="tabular-nums text-muted">{row.stock} available</span>
        ) : (
          <span className="text-rose-600">Out of stock</span>
        ),
    },
    {
      id: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => {
        const already = importedListingIds.has(row.id);
        return (
          <button
            type="button"
            disabled={row.stock === 0 || already}
            onClick={() => setImporting(row)}
            className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {already ? "Already imported" : "Import"}
          </button>
        );
      },
    },
  ];

  return (
    <DropshipShell title="Browse Suppliers">
      <p className="mb-4 text-sm text-muted">
        Products other Softunebd stores are wholesaling. Import one into your own catalog, set
        your own retail price, and the supplier ships it directly to your customer when it sells.
      </p>
      {marketplace.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No supplier listings yet"
          description="Once other stores start listing wholesale products, they'll show up here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={marketplace}
          rowKey={(row) => row.id}
          emptyMessage="No supplier listings match this search."
          pageSize={10}
        />
      )}

      <ImportProductModal
        listing={importing}
        onClose={() => setImporting(null)}
        onImport={handleImport}
      />
    </DropshipShell>
  );
}
