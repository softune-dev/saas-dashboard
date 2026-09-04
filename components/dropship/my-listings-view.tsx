"use client";

import { Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import type { SupplierListing } from "@/lib/dropship-mock";
import { AddListingModal } from "./add-listing-modal";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
import { DropshipShell } from "./dropship-shell";

export function MyListingsView() {
  const { supplierMode, setSupplierMode, myListings, addListing, removeListing } =
    useDropshipMock();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<SupplierListing | null>(null);

  function handleAdd(data: { productName: string; wholesalePriceCents: number; stock: number }) {
    addListing(data);
    toast({ title: `${data.productName} listed for wholesale`, variant: "success" });
    setAddOpen(false);
  }

  function handleRemoveConfirm() {
    if (!removing) return;
    removeListing(removing.id);
    toast({ title: "Listing removed", variant: "success" });
    setRemoving(null);
  }

  return (
    <DropshipShell
      title="My Listings"
      actions={
        supplierMode ? (
          <PrimaryButton onClick={() => setAddOpen(true)} className="px-4">
            <Plus className="size-4" strokeWidth={2} />
            <span className="hidden sm:inline">List a product</span>
          </PrimaryButton>
        ) : undefined
      }
    >
      <div className="mb-5 flex items-start justify-between gap-4 rounded-md border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Supplier mode</p>
          <p className="mt-0.5 text-xs text-muted">
            Turn this on to wholesale your products to other Softunebd stores. Your own storefront
            keeps working exactly as it does today either way.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={supplierMode}
          onClick={() => setSupplierMode(!supplierMode)}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            supplierMode ? "bg-primary" : "bg-border",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block size-4 transform rounded-full bg-white transition-transform",
              supplierMode ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </div>

      {!supplierMode ? (
        <EmptyState
          icon={Store}
          title="Supplier mode is off"
          description="Turn it on above to start wholesaling products to other stores."
        />
      ) : myListings.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No listings yet"
          description="List your first product to make it available for other stores to resell."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {myListings.map((listing) => (
            <DropshipProductCard
              key={listing.id}
              image={listing.image}
              title={listing.productName}
              supplierName={`${listing.stock} in stock`}
              priceLabel="Wholesale price"
              priceCents={listing.wholesalePriceCents}
              resellers={listing.resellers}
              footer={
                <button
                  type="button"
                  onClick={() => setRemoving(listing)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-border text-sm font-medium text-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                  Remove listing
                </button>
              }
            />
          ))}
        </div>
      )}

      <AddListingModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.productName}?`}
        description="Resellers who already imported it keep selling it, but it won't be available to import again."
        confirmLabel="Remove listing"
        destructive
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoving(null)}
      />
    </DropshipShell>
  );
}
