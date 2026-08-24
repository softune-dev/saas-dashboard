"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { MediaImage } from "@/lib/api";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { EditorLabel } from "./editor-field";
import { FALLBACK_PREVIEW_URL, resolveMediaUrl } from "./editor-types";
import { IMAGE_LIMITS_HINT } from "@/lib/constants/media-limits";
import { registerPendingUpload } from "./pending-uploads";

type HeroImagePickerProps = {
  label: string;
  /** Real backend site id — uploads are scoped to this site's own Cloudinary
   * folder. Null until the editor has resolved it (brief window on mount). */
  siteId: string | null;
  /** This site's preview server — thumbnails resolve any relative (bundled
   * template default) path against it instead of the dashboard's own origin. */
  previewUrl?: string;
  selected: string[];
  onChange: (images: string[]) => void;
  /** Thumbnail frame — 16:9 for desktop heroes, 1:1 for mobile-only set. */
  aspect?: "video" | "square";
};

/** Upload-driven picker for the hero's image set — one or many at once.
 *
 * Order matters (it's the slideshow order), so new uploads always append
 * rather than reordering. Removing a thumbnail only drops it from this
 * site's theme; it doesn't delete the file from storage, since the same
 * upload could still be referenced elsewhere. */
export function HeroImagePicker({
  label,
  siteId,
  previewUrl,
  selected,
  onChange,
  aspect = "video",
}: HeroImagePickerProps) {
  const chosen = selected ?? [];
  const baseUrl = previewUrl || FALLBACK_PREVIEW_URL;
  const [dragOver, setDragOver] = useState(false);

  // Local-only: registers each file and gets an instant blob: preview URL
  // back — no network call, no siteId needed here. The real Cloudinary
  // upload happens once, right before Publish (see pending-uploads.ts).
  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;
      const urls = list.map((file) => registerPendingUpload(file, "hero"));
      onChange([...(selected ?? []), ...urls]);
    },
    [selected, onChange],
  );

  function remove(src: string) {
    onChange(chosen.filter((s) => s !== src));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <EditorLabel>{label}</EditorLabel>

      {chosen.length > 0 ? (
        <div
          className={[
            "mt-1 grid gap-2",
            aspect === "square" ? "grid-cols-3" : "grid-cols-2",
          ].join(" ")}
        >
          {chosen.map((src) => (
            <div
              key={src}
              className={[
                "group relative overflow-hidden rounded-lg border border-border",
                aspect === "square" ? "aspect-square" : "aspect-video",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(src, baseUrl)}
                alt=""
                className="size-full object-cover"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => remove(src)}
                className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <MediaSourceMenu
        siteId={siteId}
        category="hero"
        multiple
        onUploadFiles={uploadFiles}
        onPickImages={(images: MediaImage[]) =>
          onChange([...(selected ?? []), ...images.map((i) => i.url)])
        }
      >
        {(open) => (
          <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") open();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFiles(e.dataTransfer.files);
            }}
            className={[
              "mt-1 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-5 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted hover:bg-search-bg/60",
            ].join(" ")}
          >
            <Upload className="size-4 text-slate-400" strokeWidth={1.75} />
            <span className="text-xs font-medium text-muted">
              Click to add, or drag images to upload
            </span>
            <span className="text-[11px] text-slate-400">{IMAGE_LIMITS_HINT}</span>
          </div>
        )}
      </MediaSourceMenu>
    </div>
  );
}

type SingleImagePickerProps = {
  label: string;
  siteId: string | null;
  previewUrl?: string;
  value: string;
  onChange: (image: string) => void;
  /** Cloudinary media category — defaults to "other" since this isn't the
   * hero, a product, or a category image. */
  category?: "hero" | "products" | "categories" | "other";
  /** portrait = tall section image; banner = short full-width logo strip. */
  frame?: "portrait" | "banner";
  /** Brand logos are frequently transparent PNGs with dark linework — on a
   * dark editor background that linework disappears. Forces a white preview
   * background in dark mode only (light mode already has one via
   * bg-search-bg). Opt-in, not baked into the "banner" frame generally,
   * since other banner-frame pickers (e.g. feature images) are real photos
   * that don't have this problem. */
  whiteInDark?: boolean;
};

/** Upload-driven picker for a single section image (e.g. Why Choose Us).
 * Empty is a real, intentional state — the storefront renders an empty box
 * rather than falling back to a bundled stock photo, so a merchant always
 * sees exactly what a visitor would see. */
export function SingleImagePicker({
  label,
  siteId,
  previewUrl,
  value,
  onChange,
  category = "other",
  frame = "portrait",
  whiteInDark = false,
}: SingleImagePickerProps) {
  const baseUrl = previewUrl || FALLBACK_PREVIEW_URL;
  const [dragOver, setDragOver] = useState(false);
  const isBanner = frame === "banner";

  // Local-only: registers the file and gets an instant blob: preview URL
  // back — the real Cloudinary upload happens once, right before Publish
  // (see pending-uploads.ts).
  const uploadFile = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      onChange(registerPendingUpload(file, category));
    },
    [category, onChange],
  );

  // Banner (logo): one short full-width strip — preview + upload share the
  // same frame so Brand panel height stays stable Text ↔ Image.
  if (isBanner) {
    return (
      <div className="flex flex-col gap-1.5">
        <EditorLabel>{label}</EditorLabel>
        <div
          className={[
            "group relative mt-1 h-16 w-full overflow-hidden rounded-lg border border-border",
            whiteInDark ? "bg-search-bg dark:bg-white" : "bg-search-bg",
          ].join(" ")}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(value, baseUrl)}
                alt=""
                className="size-full object-contain object-center p-2"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange("")}
                className="absolute top-1.5 right-1.5 z-10 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </>
          ) : null}
          <MediaSourceMenu
            siteId={siteId}
            category={category}
            onUploadFiles={uploadFile}
            onPickImages={(images: MediaImage[]) => {
              if (images[0]) onChange(images[0].url);
            }}
          >
            {(open) => (
              <div
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") open();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  uploadFile(e.dataTransfer.files);
                }}
                className={[
                  "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 transition-colors",
                  value
                    ? "bg-black/0 hover:bg-black/5"
                    : dragOver
                      ? "bg-primary/5"
                      : "bg-transparent",
                  !value && dragOver ? "ring-1 ring-inset ring-primary" : "",
                ].join(" ")}
              >
                {!value ? (
                  <>
                    <Upload className="size-4 text-slate-400" strokeWidth={1.75} />
                    <span className="text-xs font-medium text-muted">Add logo</span>
                  </>
                ) : null}
              </div>
            )}
          </MediaSourceMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <EditorLabel>{label}</EditorLabel>

      {value ? (
        <div className="group relative mt-1 aspect-[4/5] w-full max-w-40 overflow-hidden rounded-lg border border-border bg-search-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(value, baseUrl)}
            alt=""
            className="size-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}

      <MediaSourceMenu
        siteId={siteId}
        category={category}
        onUploadFiles={uploadFile}
        onPickImages={(images: MediaImage[]) => {
          if (images[0]) onChange(images[0].url);
        }}
      >
        {(open) => (
          <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") open();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFile(e.dataTransfer.files);
            }}
            className={[
              "mt-1 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-5 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted hover:bg-search-bg/60",
            ].join(" ")}
          >
            <Upload className="size-4 text-slate-400" strokeWidth={1.75} />
            <span className="text-xs font-medium text-muted">
              {value ? "Click to replace" : "Click to add an image"}
            </span>
            <span className="text-[11px] text-slate-400">{IMAGE_LIMITS_HINT}</span>
          </div>
        )}
      </MediaSourceMenu>
    </div>
  );
}
