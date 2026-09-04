"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { SettingsModal } from "../ui/settings-modal";
import { useLanguage } from "@/components/providers/language-provider";
import { IMAGE_LIMITS_HINT } from "@/lib/constants/media-limits";

export type UploadTask = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type UploadMediaModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
};

export function UploadMediaModal({ open, onClose, onUpload }: UploadMediaModalProps) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFiles([]);
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
      await onUpload(files);
      reset();
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <SettingsModal open={open} title={t("Upload media")} onClose={handleClose}>
      <div className="flex flex-col gap-4">
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
            {t("Drop images here or click to browse")}
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
          <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
            {files.map((file, i) => (
              <FilePreviewRow
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => removeFile(i)}
                disabled={uploading}
              />
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
            {t("Cancel")}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading
              ? "Uploading…"
              : `${t("Upload")} ${files.length > 0 ? files.length : ""} image${files.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}

/** Owns its own object URL so each row can free it the moment it's removed
 * or the modal closes, instead of leaking one per selected file. */
function FilePreviewRow({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <li className="flex items-center gap-2.5 rounded-lg bg-search-bg px-2.5 py-1.5 text-xs">
      <span className="size-8 shrink-0 overflow-hidden rounded-md bg-border">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{file.name}</p>
        <p className="text-[10px] text-muted-soft">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        disabled={disabled}
        className="shrink-0 rounded-md p-1 text-muted-soft transition-colors hover:bg-border hover:text-red-500 disabled:opacity-50"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </li>
  );
}
