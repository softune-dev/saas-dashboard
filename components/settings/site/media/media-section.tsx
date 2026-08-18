"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useToast } from "@/components/ui/toast";
import {
  cleanupSiteMedia,
  deleteSiteMedia,
  listAllSiteMedia,
  type MediaCategory,
  type MediaImage,
} from "@/lib/api";
import { formatBytes, formatNumber } from "@/lib/format";

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

/** Real gallery of everything uploaded to this site's Cloudinary folders —
 * not a mock list. Each image renders at its own real aspect ratio (the
 * tile's box ratio matches the image's own width/height, so object-cover
 * never actually crops anything) and carries an honest "in use" flag
 * computed server-side from what's currently referenced. */
export function MediaSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;

  const { data, isLoading, mutate } = useSWR(
    siteId ? [siteId, "media-all"] : null,
    ([id]) => listAllSiteMedia(id),
  );

  const [filter, setFilter] = useState<MediaCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<MediaImage[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const images = useMemo(() => {
    const all = data?.images ?? [];
    return filter === "all" ? all : all.filter((img) => img.category === filter);
  }, [data, filter]);

  function toggleSelect(publicId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  function requestDelete(imgs: MediaImage[]) {
    setPendingDelete(imgs);
  }

  async function confirmDelete() {
    if (!siteId || !pendingDelete) return;
    setDeleting(true);
    try {
      await Promise.all(pendingDelete.map((img) => deleteSiteMedia(siteId, img.public_id)));
      const deletedIds = new Set(pendingDelete.map((img) => img.public_id));
      await mutate(
        data && {
          ...data,
          images: data.images.filter((img) => !deletedIds.has(img.public_id)),
          total_count: data.total_count - pendingDelete.length,
          total_bytes: data.total_bytes - pendingDelete.reduce((n, i) => n + (i.bytes ?? 0), 0),
        },
        { revalidate: false },
      );
      setSelected((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
      toast({
        title: pendingDelete.length === 1 ? "Image removed" : `${pendingDelete.length} images removed`,
        variant: "success",
      });
      setPendingDelete(null);
    } catch (err) {
      toast({
        title: "Couldn't remove image",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleCleanup() {
    if (!siteId) return;
    setCleaning(true);
    try {
      const result = await cleanupSiteMedia(siteId);
      await mutate();
      toast({
        title:
          result.deleted > 0
            ? `Removed ${result.deleted} unused image${result.deleted === 1 ? "" : "s"}`
            : "No unused images found",
        description: `Checked ${result.checked} uploaded file${result.checked === 1 ? "" : "s"}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't run cleanup",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setCleaning(false);
    }
  }

  const selectedImages = images.filter((img) => selected.has(img.public_id));
  const anyInUse = (pendingDelete ?? []).some((img) => img.in_use);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-search-bg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Images" value={formatNumber(data?.total_count ?? 0)} />
        <StatTile label="Storage used" value={formatBytes(data?.total_bytes ?? 0)} />
        {(["hero", "products"] as MediaCategory[]).map((cat) => (
          <StatTile
            key={cat}
            label={CATEGORY_LABELS[cat]}
            value={formatNumber(data?.by_category?.[cat]?.count ?? 0)}
          />
        ))}
      </div>

      {/* Filters + cleanup */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-search-bg text-slate-500 hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCleanup}
          disabled={!siteId || cleaning}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {cleaning ? "Checking…" : "Clean up unused images"}
        </button>
      </div>

      {/* Bulk selection bar */}
      {selectedImages.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-2.5">
          <p className="text-xs font-medium text-primary">
            {selectedImages.length} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => requestDelete(selectedImages)}
              className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      {/* Gallery */}
      {images.length === 0 ? (
        <p className="rounded-md bg-search-bg px-4 py-12 text-center text-sm text-muted">
          {filter === "all"
            ? "No images uploaded yet."
            : `No images in ${CATEGORY_LABELS[filter as MediaCategory]} yet.`}
        </p>
      ) : (
        // Masonry via CSS columns, not grid — a grid row stretches every
        // tile in it to match its tallest neighbor, which with real (not
        // cropped) aspect ratios left tall gaps under anything shorter.
        // Columns let each tile keep its own real height and just flow.
        <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
          {images.map((img) => (
            <ImageTile
              key={img.public_id}
              image={img}
              selected={selected.has(img.public_id)}
              onToggleSelect={() => toggleSelect(img.public_id)}
              onDelete={() => requestDelete([img])}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={
          pendingDelete && pendingDelete.length > 1
            ? `Delete ${pendingDelete.length} images?`
            : "Delete this image?"
        }
        description={
          anyInUse
            ? "This image is currently used somewhere on your site. Removing it will just leave that spot empty — the product, category, or section it's on will keep working, it just won't show this image anymore."
            : "This isn't used anywhere on your site right now. This can't be undone."
        }
        confirmLabel={deleting ? "Removing…" : "Delete"}
        destructive
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-search-bg/40 p-3.5">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function ImageTile({
  image,
  selected,
  onToggleSelect,
  onDelete,
}: {
  image: MediaImage;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : "1 / 1";

  return (
    <div
      className={[
        "group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border bg-white transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : "border-slate-200",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={selected ? "Deselect image" : "Select image"}
        onClick={onToggleSelect}
        className="absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full border-2 border-white bg-black/30 text-white shadow-sm transition-colors hover:bg-black/50"
      >
        {selected ? (
          <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
            ✓
          </span>
        ) : null}
      </button>

      {image.in_use ? (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white">
          In use
        </span>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        style={{ aspectRatio: ratio }}
        className="w-full cursor-pointer object-cover"
        onClick={onToggleSelect}
      />

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2.5 py-2">
        <span className="truncate text-[11px] text-muted-soft">
          {formatBytes(image.bytes ?? 0)}
        </span>
        <button
          type="button"
          aria-label="Delete image"
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
        >
          <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
