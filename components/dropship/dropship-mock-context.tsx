"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  MOCK_FULFILLMENT_REQUESTS,
  MOCK_IMPORTED_PRODUCTS,
  MOCK_MY_LISTINGS,
  MOCK_SETTLEMENTS,
  MOCK_SUPPLIER_LISTINGS,
  type FulfillmentRequest,
  type FulfillmentStatus,
  type ImportedProduct,
  type SettlementEntry,
  type SupplierListing,
} from "@/lib/dropship-mock";

type DropshipMockState = {
  supplierMode: boolean;
  setSupplierMode: (on: boolean) => void;

  marketplace: SupplierListing[];
  myListings: SupplierListing[];
  addListing: (
    listing: Omit<SupplierListing, "id" | "isMine" | "supplierName" | "image">,
  ) => void;
  removeListing: (id: string) => void;

  importedProducts: ImportedProduct[];
  importProduct: (listing: SupplierListing, retailPriceCents: number) => void;

  fulfillmentRequests: FulfillmentRequest[];
  updateFulfillmentStatus: (id: string, status: FulfillmentStatus) => void;

  settlements: SettlementEntry[];
  markSettled: (id: string) => void;
};

const DropshipMockContext = createContext<DropshipMockState | null>(null);

/** Holds every piece of dropship mock state for the whole /dropship section
 * — see lib/dropship-mock.ts's module docstring for why this exists instead
 * of real API calls. Living in a Context (not per-page useState) means
 * switching tabs (Browse -> My Listings -> ...) doesn't lose in-session
 * changes, the same continuity a real backend would give for free. */
export function DropshipMockProvider({ children }: { children: ReactNode }) {
  const [supplierMode, setSupplierMode] = useState(true);
  const [marketplace, setMarketplace] = useState(MOCK_SUPPLIER_LISTINGS);
  const [myListings, setMyListings] = useState(MOCK_MY_LISTINGS);
  const [importedProducts, setImportedProducts] = useState(MOCK_IMPORTED_PRODUCTS);
  const [fulfillmentRequests, setFulfillmentRequests] = useState(MOCK_FULFILLMENT_REQUESTS);
  const [settlements, setSettlements] = useState(MOCK_SETTLEMENTS);

  function addListing(
    listing: Omit<SupplierListing, "id" | "isMine" | "supplierName" | "image">,
  ) {
    setMyListings((prev) => [
      {
        ...listing,
        id: `ml_${Date.now()}`,
        isMine: true,
        supplierName: "Your store",
        image: null,
      },
      ...prev,
    ]);
  }

  function removeListing(id: string) {
    setMyListings((prev) => prev.filter((l) => l.id !== id));
  }

  function importProduct(listing: SupplierListing, retailPriceCents: number) {
    setImportedProducts((prev) => [
      {
        id: `ip_${Date.now()}`,
        listingId: listing.id,
        productName: listing.productName,
        image: listing.image,
        supplierName: listing.supplierName,
        wholesalePriceCents: listing.wholesalePriceCents,
        retailPriceCents,
        importedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function updateFulfillmentStatus(id: string, status: FulfillmentStatus) {
    setFulfillmentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function markSettled(id: string) {
    setSettlements((prev) => prev.map((s) => (s.id === id ? { ...s, settled: true } : s)));
  }

  return (
    <DropshipMockContext.Provider
      value={{
        supplierMode,
        setSupplierMode,
        marketplace,
        myListings,
        addListing,
        removeListing,
        importedProducts,
        importProduct,
        fulfillmentRequests,
        updateFulfillmentStatus,
        settlements,
        markSettled,
      }}
    >
      {children}
    </DropshipMockContext.Provider>
  );
}

export function useDropshipMock(): DropshipMockState {
  const ctx = useContext(DropshipMockContext);
  if (!ctx) throw new Error("useDropshipMock must be used within DropshipMockProvider");
  return ctx;
}
