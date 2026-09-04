"use client";

import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import type { SupplierListing } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {marketplace.map((listing) => {
            const already = importedListingIds.has(listing.id);
            const outOfStock = listing.stock === 0;
            return (
              <DropshipProductCard
                key={listing.id}
                image={listing.image}
                title={listing.productName}
                supplierName={listing.supplierName}
                priceLabel="Wholesale price"
                priceCents={listing.wholesalePriceCents}
                meta={
                  outOfStock ? (
                    <span className="text-rose-600">Out of stock</span>
                  ) : (
                    <span className="text-muted">{listing.stock} in stock</span>
                  )
                }
                footer={
                  <button
                    type="button"
                    disabled={outOfStock || already}
                    onClick={() => setImporting(listing)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border text-sm font-medium text-foreground transition-colors hover:bg-search-bg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {already ? "Already imported" : "Import"}
                  </button>
                }
              />
            );
          })}
        </div>
      )}

      <ImportProductModal
        listing={importing}
        onClose={() => setImporting(null)}
        onImport={handleImport}
      />
    </DropshipShell>
  );
}
