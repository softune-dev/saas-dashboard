"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { formatTaka } from "@/lib/format";
import { MOCK_CATEGORIES, type SupplierListing } from "@/lib/dropship-mock";

type ImportProductModalProps = {
  listing: SupplierListing | null;
  onClose: () => void;
  onImport: (retailPriceCents: number, category: string) => void;
};

/** Set a retail price when importing a supplier's listing into your own
 * catalog. Defaults to a 60% markup over wholesale — a starting suggestion,
 * not enforced; the reseller can set anything. */
export function ImportProductModal({ listing, onClose, onImport }: ImportProductModalProps) {
  const [retailTaka, setRetailTaka] = useState("");
  const [category, setCategory] = useState<string>(MOCK_CATEGORIES[0]);

  useEffect(() => {
    if (listing) {
      const suggested = Math.round((listing.wholesalePriceCents * 1.6) / 100);
      setRetailTaka(String(suggested));
      setCategory(MOCK_CATEGORIES[0]);
    }
  }, [listing?.id]);

  if (!listing) return null;

  const retailCents = Math.round(parseFloat(retailTaka || "0") * 100);
  const marginCents = retailCents - listing.wholesalePriceCents;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (retailCents <= 0) return;
    onImport(retailCents, category);
  }

  return (
    <FormModal
      open={!!listing}
      title={`Import "${listing.productName}"`}
      submitLabel="Add to my catalog"
      compact
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border bg-search-bg px-3 py-2.5 text-sm">
          <p className="text-muted">
            Supplier: <span className="text-foreground">{listing.supplierName}</span>
          </p>
          <p className="mt-1 text-muted">
            Wholesale price:{" "}
            <span className="font-medium text-foreground">
              {formatTaka(listing.wholesalePriceCents / 100)}
            </span>
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Your retail price (৳)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            value={retailTaka}
            onChange={(e) => setRetailTaka(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {MOCK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <p className={`text-xs ${marginCents > 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {marginCents > 0
            ? `Your margin: ${formatTaka(marginCents / 100)} per unit`
            : "Retail price must be higher than the wholesale price to earn a margin."}
        </p>

        <p className="text-xs text-muted-soft">
          This adds the product to your own storefront catalog at the price above. When your
          customer buys it, the supplier ships it directly — you never handle the inventory.
        </p>
      </div>
    </FormModal>
  );
}
