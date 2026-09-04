"use client";

import { AnimatePresence, motion } from "motion/react";
import { ImageOff, Users, X } from "lucide-react";
import { useState } from "react";
import { formatTaka } from "@/lib/format";
import {
  buildSupplierContactLink,
  MOCK_SUPPLIERS_DIRECTORY,
  type SupplierListing,
} from "@/lib/dropship-mock";
import { SupplierProfileModal } from "./supplier-profile-modal";
import { WhatsAppIcon } from "./whatsapp-icon";

type ListingDetailModalProps = {
  listing: SupplierListing | null;
  onClose: () => void;
};

/** Read-only view of one of your own wholesale listings — deliberately NOT
 * the full product-editor complexity (variants, SEO, etc.) from Add
 * Product. A listing is "which product, at what wholesale price, how much
 * stock, and who's reselling it" — the real product with its full detail
 * still lives on the supplier's own Products page. */
export function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
  const [viewingProfile, setViewingProfile] = useState(false);
  const supplierEntry = listing
    ? (MOCK_SUPPLIERS_DIRECTORY.find((s) => s.name === listing.supplierName) ?? null)
    : null;

  return (
    <AnimatePresence>
      {listing ? (
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
            aria-labelledby="listing-detail-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="relative aspect-[16/9] w-full shrink-0 bg-search-bg">
              {listing.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.image} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageOff className="size-8 text-muted-soft" strokeWidth={1.5} />
                </div>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <h3 id="listing-detail-title" className="text-base font-semibold text-foreground">
                  {listing.productName}
                </h3>
                {listing.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{listing.description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border px-3 py-2.5">
                  <p className="text-xs font-medium text-muted-soft">Wholesale price</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {formatTaka(listing.wholesalePriceCents / 100)}
                  </p>
                </div>
                <div className="rounded-md border border-border px-3 py-2.5">
                  <p className="text-xs font-medium text-muted-soft">Stock</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {listing.stock}
                  </p>
                </div>
              </div>

              {!listing.isMine ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-soft">Supplier</p>
                    <p className="truncate text-sm text-foreground">{listing.supplierName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {supplierEntry ? (
                      <button
                        type="button"
                        onClick={() => setViewingProfile(true)}
                        className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                      >
                        View profile
                      </button>
                    ) : null}
                    {listing.supplierContact &&
                    buildSupplierContactLink(listing.supplierContact, listing.supplierName) ? (
                      <a
                        href={
                          buildSupplierContactLink(listing.supplierContact, listing.supplierName)!
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                      >
                        <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                        Contact
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Users className="size-3.5 text-muted-soft" strokeWidth={1.75} />
                  <p className="text-xs font-medium text-muted">
                    Resold by {listing.resellers?.length ?? 0} store
                    {(listing.resellers?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                {!listing.resellers || listing.resellers.length === 0 ? (
                  <p className="text-sm text-muted-soft">No stores reselling this yet.</p>
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {listing.resellers.map((name) => (
                      <li
                        key={name}
                        className="rounded-md bg-search-bg px-3 py-1.5 text-sm text-foreground"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      <SupplierProfileModal
        supplier={viewingProfile ? supplierEntry : null}
        onClose={() => setViewingProfile(false)}
      />
    </AnimatePresence>
  );
}
