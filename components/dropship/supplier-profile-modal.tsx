"use client";

import { AnimatePresence, motion } from "motion/react";
import { MapPin, PackageSearch, X } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  buildSupplierContactLink,
  type SupplierDirectoryEntry,
  type SupplierListing,
} from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
import { ImportProductModal } from "./import-product-modal";
import { ListingDetailModal } from "./listing-detail-modal";
import { SupplierLogo } from "./supplier-logo";
import { WhatsAppIcon } from "./whatsapp-icon";

type SupplierProfileModalProps = {
  supplier: SupplierDirectoryEntry | null;
  onClose: () => void;
};

/** Full profile for one supplier — account info plus every product they've
 * listed, with Import available right here so a reseller doesn't have to
 * go back to Browse Suppliers and hunt for the same supplier's other
 * products one at a time. */
export function SupplierProfileModal({ supplier, onClose }: SupplierProfileModalProps) {
  const { marketplace, importedProducts, importProduct } = useDropshipMock();
  const { toast } = useToast();
  const [importing, setImporting] = useState<SupplierListing | null>(null);
  const [viewing, setViewing] = useState<SupplierListing | null>(null);

  const listings = supplier ? marketplace.filter((l) => l.supplierName === supplier.name) : [];
  const importedListingIds = new Set(importedProducts.map((p) => p.listingId));
  const contactLink = supplier ? buildSupplierContactLink(supplier.contact, supplier.name) : null;

  function handleImport(retailPriceCents: number, category: string) {
    if (!importing) return;
    importProduct(importing, retailPriceCents, category);
    toast({ title: `${importing.productName} added to your catalog`, variant: "success" });
    setImporting(null);
  }

  return (
    <AnimatePresence>
      {supplier ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-profile-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <SupplierLogo name={supplier.name} logo={supplier.logo} size="lg" />
                <div className="min-w-0 pt-0.5">
                  <h3
                    id="supplier-profile-title"
                    className="text-base font-semibold text-foreground"
                  >
                    {supplier.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3.5" strokeWidth={1.75} />
                    {supplier.city}
                  </p>
                  <p className="mt-2 text-sm text-muted">{supplier.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {contactLink ? (
                  <a
                    href={contactLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                  >
                    <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                    Contact
                  </a>
                ) : null}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-soft transition-colors hover:bg-search-bg hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <PackageSearch className="size-6 text-muted-soft" strokeWidth={1.5} />
                  <p className="text-sm text-muted">No listings from this supplier yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {listings.map((listing) => {
                    const already = importedListingIds.has(listing.id);
                    const outOfStock = listing.stock === 0;
                    return (
                      <DropshipProductCard
                        key={listing.id}
                        image={listing.image}
                        title={listing.productName}
                        supplierName={supplier.name}
                        wholesalePriceCents={listing.wholesalePriceCents}
                        stock={listing.stock}
                        outOfStock={outOfStock}
                        deliveryLocations={listing.deliveryLocations}
                        deliveryFeeCents={listing.deliveryFeeCents}
                        onClick={() => setViewing(listing)}
                        footer={
                          already ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-9 w-full cursor-not-allowed items-center justify-center rounded-full border border-border text-sm font-medium text-muted"
                            >
                              Already imported
                            </button>
                          ) : (
                            <PrimaryButton
                              disabled={outOfStock}
                              onClick={() => setImporting(listing)}
                              className="h-9 w-full disabled:cursor-not-allowed"
                            >
                              Import
                            </PrimaryButton>
                          )
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          <ImportProductModal
            listing={importing}
            onClose={() => setImporting(null)}
            onImport={handleImport}
          />
          <ListingDetailModal listing={viewing} onClose={() => setViewing(null)} />
        </div>
      ) : null}
    </AnimatePresence>
  );
}
