"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { MediaImage } from "@/lib/api";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import type { GalleryImage } from "./product-form-types";

function imageKey(img: GalleryImage): string {
  return img.kind === "uploaded" ? img.url : img.previewUrl;
}

function srcOf(img: GalleryImage): string {
  return img.kind === "uploaded" ? img.url : img.previewUrl;
}

const tileClass =
  "relative size-40 shrink-0 overflow-hidden rounded-lg bg-search-bg sm:size-44";

type ProductMediaGalleryProps = {
  siteId: string | null;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  onAdd: (file: File) => void;
  onAddFromLibrary: (images: MediaImage[]) => void;
  onRemove: (img: GalleryImage) => void;
};

/** Equal-size gallery tiles. First image in the list is primary for the
 * storefront (click a non-first tile to promote it); no badge chrome. */
export function ProductMediaGallery({
  siteId,
  images,
  onChange,
  onAdd,
  onAddFromLibrary,
  onRemove,
}: ProductMediaGalleryProps) {
  const { t } = useLanguage();
  function setPrimary(index: number) {
    if (index <= 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{t("Media")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {t("First image is primary. Click another to make it primary. Uploaded when you save.")}{" "}
            {t("JPEG, PNG, WebP, or AVIF · up to 10MB.")}
          </p>
        </div>
        {images.length > 0 ? (
          <span className="rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
            {images.length} {images.length === 1 ? t("image") : t("images")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img, index) => (
          <div key={imageKey(img)} className={`group ${tileClass}`}>
            <button
              type="button"
              aria-label={
                index === 0
                  ? "Primary product image"
                  : "Set as primary image"
              }
              onClick={() => setPrimary(index)}
              className="size-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={srcOf(img)}
                alt=""
                className="size-full object-cover"
              />
            </button>
            {index === 0 ? (
              <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
                <Star className="size-2.5 fill-white" strokeWidth={0} />
                {t("Primary")}
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onRemove(img)}
              className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/75"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </div>
        ))}

        <MediaSourceMenu
          siteId={siteId}
          category="products"
          multiple
          onUploadFiles={(files) => {
            for (const file of Array.from(files)) onAdd(file);
          }}
          onPickImages={onAddFromLibrary}
        >
          {(open) => (
            <button
              type="button"
              onClick={open}
              className={`${tileClass} flex cursor-pointer flex-col items-center justify-center gap-1.5 text-muted ring-1 ring-dashed ring-border dark:ring-white/15 transition-colors hover:bg-search-bg hover:text-foreground`}
            >
              <ImagePlus className="size-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{t("Add image")}</span>
            </button>
          )}
        </MediaSourceMenu>
      </div>
    </section>
  );
}
