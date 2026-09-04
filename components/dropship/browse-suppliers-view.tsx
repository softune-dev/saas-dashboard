"use client";

import { Info, PackageSearch } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TablePagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { SupplierListing } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
import { DropshipShell } from "./dropship-shell";
import { ImportProductModal } from "./import-product-modal";
import { ListingDetailModal } from "./listing-detail-modal";

const PAGE_SIZE = 8;

export function BrowseSuppliersView() {
  const { marketplace, importedProducts, importProduct } = useDropshipMock();
  const { toast } = useToast();
  const [importing, setImporting] = useState<SupplierListing | null>(null);
  const [viewing, setViewing] = useState<SupplierListing | null>(null);
  const [page, setPage] = useState(1);

  const importedListingIds = new Set(importedProducts.map((p) => p.listingId));
  const totalPages = Math.max(1, Math.ceil(marketplace.length / PAGE_SIZE));
  const pageItems = marketplace.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleImport(retailPriceCents: number, category: string) {
    if (!importing) return;
    importProduct(importing, retailPriceCents, category);
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
        <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((listing) => {
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
                onClick={() => setViewing(listing)}
                footer={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewing(listing)}
                      aria-label="View details"
                      title="View details"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-soft transition-colors hover:bg-search-bg hover:text-foreground"
                    >
                      <Info className="size-4" strokeWidth={1.75} />
                    </button>
                    {already ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 flex-1 cursor-not-allowed items-center justify-center rounded-full border border-border text-sm font-medium text-muted"
                      >
                        Already imported
                      </button>
                    ) : (
                      <PrimaryButton
                        disabled={outOfStock}
                        onClick={() => setImporting(listing)}
                        className="h-9 flex-1 disabled:cursor-not-allowed"
                      >
                        Import
                      </PrimaryButton>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
        <div className="mt-4">
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={marketplace.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
        </>
      )}

      <ImportProductModal
        listing={importing}
        onClose={() => setImporting(null)}
        onImport={handleImport}
      />
      <ListingDetailModal listing={viewing} onClose={() => setViewing(null)} />
    </DropshipShell>
  );
}
