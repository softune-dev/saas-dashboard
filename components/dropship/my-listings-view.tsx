"use client";

import { Pencil, Plus, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import type { SupplierListing } from "@/lib/dropship-mock";
import { AddListingModal } from "./add-listing-modal";
import { BecomeSupplierModal } from "./become-supplier-modal";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipProductCard } from "./dropship-product-card";
import { DropshipShell } from "./dropship-shell";
import { ListingDetailModal } from "./listing-detail-modal";

export function MyListingsView() {
  const {
    supplierMode,
    setSupplierMode,
    supplierProfile,
    saveSupplierProfile,
    myListings,
    addListing,
    removeListing,
  } = useDropshipMock();
  const { toast } = useToast();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<SupplierListing | null>(null);
  const [viewing, setViewing] = useState<SupplierListing | null>(null);

  function handleAdd(data: Parameters<typeof addListing>[0]) {
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

  function handleOnboard(profile: Parameters<typeof saveSupplierProfile>[0]) {
    saveSupplierProfile(profile);
    toast({ title: "You're now a supplier", variant: "success" });
    setOnboardOpen(false);
  }

  // No profile yet — the whole page is a single, clear call to action, not
  // a toggle sitting above an empty state. Becoming a supplier is a real
  // decision (your name ships on other stores' parcels); the page should
  // read like one, not like a settings switch.
  if (!supplierProfile) {
    return (
      <DropshipShell title="My Listings">
        <EmptyState
          icon={Store}
          title="You're not a supplier yet"
          description="Other Softunebd stores can resell your products once you set up a supplier profile — takes a couple of minutes."
          action={
            <PrimaryButton onClick={() => setOnboardOpen(true)} className="px-4">
              Become a Supplier
            </PrimaryButton>
          }
        />
        <BecomeSupplierModal
          open={onboardOpen}
          onClose={() => setOnboardOpen(false)}
          onSave={handleOnboard}
        />
      </DropshipShell>
    );
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
      <div className="mb-5 flex flex-col gap-4 rounded-md border border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{supplierProfile.businessName}</p>
            <p className="text-xs text-muted">
              {supplierProfile.city} · {supplierProfile.publicPhone}
            </p>
            <button
              type="button"
              onClick={() => setOnboardOpen(true)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
            >
              <Pencil className="size-3" strokeWidth={2} />
              Edit supplier profile
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:pl-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {supplierMode ? "Active" : "Paused"}
            </p>
            <p className="text-xs text-muted">Accepting fulfillment</p>
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
      </div>

      {!supplierMode ? (
        <EmptyState
          icon={Store}
          title="Supplier mode is paused"
          description="Turn it back on above to accept new fulfillment requests. Your existing listings stay saved."
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
              onClick={() => setViewing(listing)}
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
      <BecomeSupplierModal
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        onSave={handleOnboard}
      />
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.productName}?`}
        description="Resellers who already imported it keep selling it, but it won't be available to import again."
        confirmLabel="Remove listing"
        destructive
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoving(null)}
      />
      <ListingDetailModal listing={viewing} onClose={() => setViewing(null)} />
    </DropshipShell>
  );
}
