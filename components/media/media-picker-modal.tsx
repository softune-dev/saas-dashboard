"use client";

import { Check, ImageOff, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { PrimaryButton } from "@/components/ui/primary-button";
import { listAllSiteMedia, type MediaCategory, type MediaImage } from "@/lib/api";

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  hero: "Hero",
  products: "Products",
  categories: "Categories",
  other: "Other",
};

const FILTERS: { value: MediaCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hero", label: "Hero" },
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
  { value: "other", label: "Other" },
];

type MediaPickerModalProps = {
  open: boolean;
  siteId: string | null;
  onClose: () => void;
  onSelect: (images: MediaImage[]) => void;
  /** Single mode replaces the current selection on every click and confirms
   * immediately — no separate "Use image" step, since there's nothing to
   * batch. Multiple mode needs the explicit confirm button since the whole
   * point is picking more than one before committing. */
  multiple?: boolean;
  /** Preselect the category tab a picker opens on — e.g. a product image
   * picker opening straight to "Products" instead of "All" every time. */
  initialCategory?: MediaCategory;
};

/** Same SWR key as MediaSection/ShopInfoPanel on purpose — this shares
 * their cache. Uploading a new image anywhere and then immediately opening
 * a picker sees it without a fresh fetch, since whichever upload flow
 * triggered `mutate` on that key already refreshed it. */
export function MediaPickerModal({
  open,
  siteId,
  onClose,
  onSelect,
  multiple = false,
  initialCategory,
}: MediaPickerModalProps) {
  const { data, isLoading } = useSWR(
    open && siteId ? [siteId, "media-all"] : null,
    ([id]) => listAllSiteMedia(id),
  );

  const [filter, setFilter] = useState<MediaCategory | "all">(initialCategory ?? "all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const images = useMemo(() => {
    const all = data?.images ?? [];
    return filter === "all" ? all : all.filter((img) => img.category === filter);
  }, [data, filter]);

  function toggle(image: MediaImage) {
    if (!multiple) {
      onSelect([image]);
      handleClose();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(image.public_id)) next.delete(image.public_id);
      else next.add(image.public_id);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = images.filter((img) => selected.has(img.public_id));
    onSelect(chosen);
    handleClose();
  }

  function handleClose() {
    setSelected(new Set());
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-picker-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 id="media-picker-title" className="text-[15px] font-semibold text-foreground">
                Choose from Media
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 px-5 py-3">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === f.value
                      ? "bg-primary text-white"
                      : "bg-search-bg text-muted hover:bg-border",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-lg bg-search-bg" />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <ImageOff className="size-6 text-muted-soft" strokeWidth={1.5} />
                  <p className="text-sm text-muted">
                    {filter === "all"
                      ? "No images uploaded yet."
                      : `No ${CATEGORY_LABELS[filter as MediaCategory].toLowerCase()} images yet.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img) => {
                    const isSelected = multiple && selected.has(img.public_id);
                    return (
                      <button
                        key={img.public_id}
                        type="button"
                        onClick={() => toggle(img)}
                        className={[
                          "group relative aspect-square overflow-hidden rounded-lg border-2 bg-search-bg transition-colors",
                          isSelected
                            ? "border-primary"
                            : "border-transparent hover:border-slate-300",
                        ].join(" ")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          className="size-full object-cover"
                        />
                        {isSelected ? (
                          <span className="absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {multiple ? (
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-muted">
                  {selected.size} selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-search-bg px-4 text-sm font-medium text-foreground transition-colors hover:bg-border"
                  >
                    Cancel
                  </button>
                  <PrimaryButton
                    type="button"
                    onClick={handleConfirm}
                    disabled={selected.size === 0}
                    className="h-10"
                  >
                    Use {selected.size || ""} image{selected.size === 1 ? "" : "s"}
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
