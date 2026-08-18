"use client";

import { Link as LinkIcon, Loader2, Upload, Video, X } from "lucide-react";
import { useState } from "react";
import { EditorLabel } from "@/components/themes/editor/editor-field";

type Mode = "upload" | "link";

/** Detects a pasted URL vs an uploaded Cloudinary URL well enough to decide
 * how the storefront should render it (native <video> vs an embed) — see
 * templates/aurora's product page. Not exhaustive; good enough for the two
 * cases merchants actually paste (YouTube/Vimeo links vs our own uploads). */
function looksLikeExternalLink(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

type ProductVideoFieldProps = {
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  onUploadFile: (file: File) => void;
};

/** Video is either an uploaded file (Cloudinary, autoplays natively as
 * muted+loop on the storefront) or a pasted link (YouTube/Vimeo, autoplays
 * via that platform's embed params) — one field, two ways to fill it,
 * because the storefront needs to know which rendering path to use. */
export function ProductVideoField({
  value,
  onChange,
  uploading,
  onUploadFile,
}: ProductVideoFieldProps) {
  const [mode, setMode] = useState<Mode>(
    value && looksLikeExternalLink(value) ? "link" : "upload",
  );
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <EditorLabel>Product video</EditorLabel>
        <div className="flex gap-1 rounded-lg bg-search-bg p-0.5">
          {(["upload", "link"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={[
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                mode === m ? "bg-white text-foreground shadow-sm" : "text-muted",
              ].join(" ")}
            >
              {m === "upload" ? "Upload" : "Link"}
            </button>
          ))}
        </div>
      </div>

      {mode === "link" ? (
        <div className="flex items-center gap-2">
          <LinkIcon className="size-4 shrink-0 text-muted-soft" strokeWidth={1.75} />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
            className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-search-bg/60 px-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary focus:bg-white"
          />
        </div>
      ) : value ? (
        <div className="flex items-center gap-2 rounded-lg bg-search-bg px-3 py-2">
          <Video className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{value}</span>
          <button
            type="button"
            aria-label="Remove video"
            onClick={() => onChange("")}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-soft transition-colors hover:bg-white hover:text-red-500"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onUploadFile(file);
          }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-5 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-300 hover:border-slate-400 hover:bg-search-bg/60",
          ].join(" ")}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin text-slate-400" />
          ) : (
            <Upload className="size-4 text-slate-400" strokeWidth={1.75} />
          )}
          <span className="text-xs font-medium text-slate-500">
            {uploading ? "Uploading…" : "Click or drag a video to upload"}
          </span>
          {!uploading ? (
            <span className="text-[11px] text-slate-400">MP4, WebM, or MOV · up to 100MB</span>
          ) : null}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      )}
      <p className="text-[11px] text-muted-soft">
        Plays automatically (muted) when a visitor views the product.
      </p>
    </div>
  );
}
