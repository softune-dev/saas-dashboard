"use client";

import { X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { DELIVERY_LOCATIONS, type DeliveryLocation } from "@/lib/dropship-mock";

type AddListingModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    productName: string;
    shortDescription: string;
    description: string;
    colors: string[];
    deliveryLocations: DeliveryLocation[];
    wholesalePriceCents: number;
    stock: number;
  }) => void;
};

/** Wholesale a product to other Softunebd stores. Deliberately not tied to
 * a specific existing catalog product yet (that link is a backend concern —
 * this is the frontend shape only). Asks for the same things a reseller
 * actually needs to decide whether to import: what it is, what it looks
 * like, where it can ship, price, and stock. */
export function AddListingModal({ open, onClose, onAdd }: AddListingModalProps) {
  const [productName, setProductName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [wholesaleTaka, setWholesaleTaka] = useState("");
  const [stock, setStock] = useState("");

  function reset() {
    setProductName("");
    setShortDescription("");
    setDescription("");
    setColorInput("");
    setColors([]);
    setDeliveryLocations([]);
    setWholesaleTaka("");
    setStock("");
  }

  function addColor() {
    const value = colorInput.trim();
    if (!value || colors.includes(value)) return;
    setColors((prev) => [...prev, value]);
    setColorInput("");
  }

  function handleColorKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addColor();
    }
  }

  function removeColor(value: string) {
    setColors((prev) => prev.filter((c) => c !== value));
  }

  function toggleLocation(location: DeliveryLocation) {
    setDeliveryLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const wholesalePriceCents = Math.round(parseFloat(wholesaleTaka || "0") * 100);
    const stockCount = parseInt(stock || "0", 10);
    if (!productName.trim() || wholesalePriceCents <= 0) return;
    onAdd({
      productName: productName.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      colors,
      deliveryLocations,
      wholesalePriceCents,
      stock: stockCount,
    });
    reset();
  }

  return (
    <FormModal
      open={open}
      title="List a product for wholesale"
      submitLabel="Add listing"
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
            placeholder="Cotton Panjabi — Off White"
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Short description</span>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Breathable cotton panjabi, everyday wear"
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Full description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fabric, fit, care instructions, what makes it worth reselling"
            className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Colors available</span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5">
            {colors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 rounded-full bg-search-bg px-2 py-1 text-xs text-foreground"
              >
                {color}
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  aria-label={`Remove ${color}`}
                  className="text-muted-soft hover:text-foreground"
                >
                  <X className="size-3" strokeWidth={2} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={handleColorKeyDown}
              onBlur={addColor}
              placeholder={colors.length === 0 ? "Off White, Sky Blue" : "Add another"}
              className="h-7 flex-1 min-w-24 border-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-soft"
            />
          </div>
        </label>

        <div>
          <span className="text-xs font-medium text-muted-soft">Delivery areas</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DELIVERY_LOCATIONS.map((location) => {
              const active = deliveryLocations.includes(location);
              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => toggleLocation(location)}
                  className={[
                    "h-9 rounded-full border px-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:bg-search-bg",
                  ].join(" ")}
                >
                  {location}
                </button>
              );
            })}
          </div>
        </div>

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
      </div>
    </FormModal>
  );
}
