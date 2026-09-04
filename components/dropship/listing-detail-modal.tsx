"use client";

import { AnimatePresence, motion } from "motion/react";
import { ImageOff, Users, X } from "lucide-react";
import { formatTaka } from "@/lib/format";
import { buildSupplierContactLink, type SupplierListing } from "@/lib/dropship-mock";

type ListingDetailModalProps = {
  listing: SupplierListing | null;
  onClose: () => void;
};

/** Real WhatsApp glyph — lucide-react ships no brand icons, and the Contact
 * button links to wa.me, so a generic chat bubble misrepresents what it does. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.3.38-.43.51-.14.14-.29.29-.13.57.17.29.75 1.24 1.61 2.01 1.11 1 2.04 1.31 2.33 1.46.29.14.46.12.63-.08.17-.19.72-.83.91-1.12.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.21.55.33.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

/** Read-only view of one of your own wholesale listings — deliberately NOT
 * the full product-editor complexity (variants, SEO, etc.) from Add
 * Product. A listing is "which product, at what wholesale price, how much
 * stock, and who's reselling it" — the real product with its full detail
 * still lives on the supplier's own Products page. */
export function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
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
                  {listing.supplierContact &&
                  buildSupplierContactLink(listing.supplierContact, listing.supplierName) ? (
                    <a
                      href={
                        buildSupplierContactLink(listing.supplierContact, listing.supplierName)!
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                    >
                      <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                      Contact
                    </a>
                  ) : null}
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
    </AnimatePresence>
  );
}
