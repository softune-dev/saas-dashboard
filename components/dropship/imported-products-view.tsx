"use client";

import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTaka } from "@/lib/format";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
import { DropshipShell } from "./dropship-shell";

export function ImportedProductsView() {
  const { importedProducts } = useDropshipMock();

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {importedProducts.map((product) => {
            const margin = product.retailPriceCents - product.wholesalePriceCents;
            return (
              <DropshipProductCard
                key={product.id}
                image={product.image}
                title={product.productName}
                supplierName={`Supplied by ${product.supplierName}`}
                priceLabel="Your retail price"
                priceCents={product.retailPriceCents}
                meta={
                  <span className={margin > 0 ? "text-emerald-600" : "text-rose-600"}>
                    {margin > 0 ? `+${formatTaka(margin / 100)} margin` : "No margin — raise your price"}
                  </span>
                }
              />
            );
          })}
        </div>
      )}
    </DropshipShell>
  );
}
