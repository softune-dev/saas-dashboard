"use client";

import { Upload } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useToast } from "@/components/ui/toast";
import {
  deleteSiteMedia,
  listAllSiteMedia,
  uploadSiteMediaWithProgress,
  type MediaCategory,
  type MediaImage,
} from "@/lib/api";
import { formatBytes, formatNumber } from "@/lib/format";
import { UploadMediaModal } from "./upload-media-modal";

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
  const { toast, update: updateToast } = useToast();
  const siteId = currentSite?.id ?? null;

  const { data, isLoading, mutate } = useSWR(
    siteId ? [siteId, "media-all"] : null,
    ([id]) => listAllSiteMedia(id),
  );

  const [filter, setFilter] = useState<MediaCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<MediaImage[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

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

  /** Uploads standalone, ahead of use in any product/category form — the
   * point is stocking the library so MediaSourceMenu's "Choose from Media"
   * has real options later, not attaching to anything right now. Always
   * "other": asking the merchant to guess a category just to store a file
   * was a needless step — a product/category form's own upload call
   * (uploadSiteMedia(..., "products") etc.) is where an image gets its
   * real category, at the point it's actually used for that purpose.
   * Sequential, not Promise.all: a plan-storage-limit rejection partway
   * through should stop cleanly (see app/api/media.py's
   * _assert_storage_available) instead of firing every remaining request
   * in parallel against an already-full quota.
   *
   * One toast per file, created up front so a multi-file upload shows every
   * file immediately (queued ones just sit at 0% until their turn) instead
   * of a single opaque "Uploading…" that gives no sense of progress or of
   * which file is stuck if something goes wrong. */
  async function handleUpload(files: File[]) {
    if (!siteId) return;
    const category: MediaCategory = "other";
    const toastIds = files.map((file) =>
      toast({
        title: file.name,
        description: formatBytes(file.size),
        progress: 0,
        duration: 2200,
      }),
    );

    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const id = toastIds[i]!;
      try {
        await uploadSiteMediaWithProgress(siteId, file, category, (fraction) =>
          updateToast(id, { progress: Math.round(fraction * 100) }),
        );
        uploaded += 1;
        updateToast(id, {
          progress: 100,
          variant: "success",
          description: `${formatBytes(file.size)} · Uploaded`,
        });
      } catch (err) {
        updateToast(id, {
          progress: 100,
          variant: "info",
          description: err instanceof Error ? err.message : "Something went wrong.",
          duration: 5000,
        });
        // A plan-storage-limit rejection applies to every file after this
        // one too — mark the rest as skipped instead of leaving them
        // stuck at 0% forever.
        for (let j = i + 1; j < files.length; j++) {
          updateToast(toastIds[j]!, {
            progress: 100,
            variant: "info",
            description: "Skipped — previous upload failed",
          });
        }
        break;
      }
    }
    if (uploaded > 0) await mutate();
  }

  const selectedImages = images.filter((img) => selected.has(img.public_id));
  const anyInUse = (pendingDelete ?? []).some((img) => img.in_use);
  const storagePct =
    data && data.limit_bytes > 0
      ? Math.min(1, Math.max(0, data.total_bytes / data.limit_bytes))
      : 0;

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
        <StorageStatTile
          usedBytes={data?.total_bytes ?? 0}
          limitBytes={data?.limit_bytes ?? 0}
          plan={data?.plan}
          pct={storagePct}
        />
        {(["products", "categories"] as MediaCategory[]).map((cat) => (
          <StatTile
            key={cat}
            label={CATEGORY_LABELS[cat]}
            value={formatNumber(data?.by_category?.[cat]?.count ?? 0)}
          />
        ))}
      </div>

      {/* Filters & Actions — Upload sits above the chips on small screens
       * (full width) so the category tabs can stay a single swipeable row
       * instead of wrapping under a squeezed button. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          disabled={!siteId}
          className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:order-2 sm:w-auto"
        >
          <Upload className="size-3.5" strokeWidth={2} />
          Upload
        </button>
        <div
          role="group"
          aria-label="Filter by category"
          className="flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none sm:order-1 sm:flex-1"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={[
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-search-bg text-muted hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
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
              className="text-xs font-medium text-muted hover:text-foreground"
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-search-bg px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {filter === "all"
              ? "No images uploaded yet."
              : `No images in ${CATEGORY_LABELS[filter as MediaCategory]} yet.`}
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Upload your first image
          </button>
        </div>
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

      <UploadMediaModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-search-bg/40 p-3.5">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

/** Same ring language as the dashboard's My Shop panel
 * (StorageProgressRing in shop-info-panel.tsx) — real used/limit from
 * app/media.py's PLAN_STORAGE_LIMIT_BYTES, not a decorative estimate. */
function StorageStatTile({
  usedBytes,
  limitBytes,
  plan,
  pct,
}: {
  usedBytes: number;
  limitBytes: number;
  plan: string | undefined;
  pct: number;
}) {
  const size = 34;
  const stroke = 4.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const low = pct >= 0.9;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-search-bg/40 p-3.5">
      <span className="relative flex shrink-0 items-center justify-center" aria-hidden>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={[
              "transition-[stroke-dashoffset] duration-500",
              low ? "text-red-500" : "text-primary",
            ].join(" ")}
          />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {formatBytes(usedBytes)}
        </p>
        <p className="truncate text-xs text-muted">
          of {formatBytes(limitBytes)}
        </p>
      </div>
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
        "group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border bg-surface transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
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

      <div className="flex items-center justify-between gap-2 border-t border-border dark:border-transparent px-2.5 py-2">
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
