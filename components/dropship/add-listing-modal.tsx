"use client";

import { useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";

type AddListingModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { productName: string; wholesalePriceCents: number; stock: number }) => void;
};

/** Wholesale a product to other Softunebd stores. Deliberately not tied to
 * a specific existing catalog product yet (that link is a backend concern —
 * this is the frontend shape only) — just name, wholesale price, and stock,
 * the three things a reseller needs to decide whether to import it. */
export function AddListingModal({ open, onClose, onAdd }: AddListingModalProps) {
  const [productName, setProductName] = useState("");
  const [wholesaleTaka, setWholesaleTaka] = useState("");
  const [stock, setStock] = useState("");

  function reset() {
    setProductName("");
    setWholesaleTaka("");
    setStock("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const wholesalePriceCents = Math.round(parseFloat(wholesaleTaka || "0") * 100);
    const stockCount = parseInt(stock || "0", 10);
    if (!productName.trim() || wholesalePriceCents <= 0) return;
    onAdd({ productName: productName.trim(), wholesalePriceCents, stock: stockCount });
    reset();
  }

  return (
    <FormModal
      open={open}
      title="List a product for wholesale"
      submitLabel="Add listing"
      compact
      onClose={() => {
        reset();
        onClose();
      }}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Product name</span>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Cotton Panjabi — Off White"
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-soft">Wholesale price (৳)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={wholesaleTaka}
              onChange={(e) => setWholesaleTaka(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-soft">Stock available</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>

        <p className="text-xs text-muted-soft">
          This is the price other Softunebd stores pay when they resell your product. Set your
          own retail price on your own storefront separately — resellers never see it.
        </p>
      </div>
    </FormModal>
  );
}
