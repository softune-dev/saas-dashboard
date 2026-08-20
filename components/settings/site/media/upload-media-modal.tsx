"use client";

import { Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { SettingsModal } from "../ui/settings-modal";
import { IMAGE_LIMITS_HINT } from "@/lib/constants/media-limits";
import type { MediaCategory } from "@/lib/api";

const CATEGORY_OPTIONS: { value: MediaCategory; label: string; hint: string }[] = [
  { value: "hero", label: "Hero", hint: "Homepage hero slideshow" },
  { value: "products", label: "Products", hint: "Product photos" },
  { value: "categories", label: "Categories", hint: "Category thumbnails/banners" },
  { value: "other", label: "Other", hint: "Logo, favicon, everything else" },
];

export type UploadTask = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type UploadMediaModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[], category: MediaCategory) => Promise<void>;
};

/** Two-step: pick which of the site's four Cloudinary folders these go into
 * (see app/media.py), then drop/select as many files as needed. Uploading
 * standalone here (not through a product/category form) is what lets a
 * merchant stock the library ahead of time and reuse images later via
 * MediaSourceMenu's "Choose from Media" picker. */
export function UploadMediaModal({ open, onClose, onUpload }: UploadMediaModalProps) {
  const [category, setCategory] = useState<MediaCategory>("products");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFiles([]);
    setCategory("products");
    setUploading(false);
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onClose();
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await onUpload(files, category);
      reset();
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <SettingsModal open={open} title="Upload media" onClose={handleClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Where does this go?</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={[
                  "flex items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                  category === opt.value
                    ? "border-primary bg-primary"
                    : "border-border hover:bg-search-bg",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-semibold",
                    category === opt.value ? "text-white" : "text-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          ].join(" ")}
        >
          <Upload className="size-5 text-muted-soft" strokeWidth={1.75} />
          <p className="text-xs font-medium text-foreground">
            Drop images here or click to browse
          </p>
          <p className="text-[10px] text-muted-soft">{IMAGE_LIMITS_HINT} · multiple files ok</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 ? (
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-search-bg px-3 py-1.5 text-xs"
              >
                <span className="min-w-0 truncate text-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={uploading}
                  className="shrink-0 text-muted-soft hover:text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading
              ? "Uploading…"
              : `Upload ${files.length > 0 ? files.length : ""} image${files.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
