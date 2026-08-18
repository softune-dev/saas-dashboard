"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import type { MediaCategory, MediaImage } from "@/lib/api";
import { MediaPickerModal } from "./media-picker-modal";

type MediaSourceMenuProps = {
  siteId: string | null;
  /** Which category tab the library picker opens on — cosmetic only, "All"
   * is always still reachable from there. */
  category?: MediaCategory;
  multiple?: boolean;
  onUploadFiles: (files: FileList) => void;
  onPickImages: (images: MediaImage[]) => void;
  /** Render prop: call `open()` from whatever trigger UI the caller already
   * has (a drop zone, a banner strip, a circular avatar) instead of a
   * native file input directly handling the click — that's now owned by
   * this component, so every existing trigger's own visual layout stays
   * completely unchanged, only what happens on click does. */
  children: (open: () => void) => ReactNode;
};

/** "Upload from device" vs "Choose from Media" — the one decision every
 * image field in the dashboard now needs to offer, instead of only ever
 * re-uploading the same file a merchant already has on Cloudinary. A small
 * centered chooser rather than an anchored dropdown on purpose: the
 * triggers this wraps have wildly different shapes (a 64px banner strip, a
 * portrait box, a circular avatar, a gallery tile) — positioning a popover
 * correctly against all of them isn't worth it for two buttons. */
export function MediaSourceMenu({
  siteId,
  category,
  multiple = false,
  onUploadFiles,
  onPickImages,
  children,
}: MediaSourceMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      {children(() => setChooserOpen(true))}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onUploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <AnimatePresence>
        {chooserOpen ? (
          <div className="fixed inset-0 z-[92] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/35"
              onClick={() => setChooserOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-xs overflow-hidden rounded-2xl bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Add image</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setChooserOpen(false)}
                  className="inline-flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setChooserOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-search-bg"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="size-4" strokeWidth={1.75} />
                  </span>
                  Upload from device
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChooserOpen(false);
                    setPickerOpen(true);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-search-bg"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ImageIcon className="size-4" strokeWidth={1.75} />
                  </span>
                  Choose from Media
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <MediaPickerModal
        open={pickerOpen}
        siteId={siteId}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickImages}
        multiple={multiple}
        initialCategory={category}
      />
    </>
  );
}
