"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { EditorField, EditorInput, EditorLabel } from "./editor-field";
import type { EditorTestimonial } from "./editor-types";

function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function TestimonialsEditor({
  siteId,
  title,
  items,
  onTitleChange,
  onChange,
}: {
  siteId: string | null;
  title: string;
  items: EditorTestimonial[];
  onTitleChange: (v: string) => void;
  onChange: (items: EditorTestimonial[]) => void;
}) {
  const { toast } = useToast();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const list = Array.isArray(items) ? items : [];

  function patch(id: string, partial: Partial<EditorTestimonial>) {
    onChange(list.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  function remove(id: string) {
    onChange(list.filter((t) => t.id !== id));
  }

  function add() {
    onChange([
      ...list,
      {
        id: newId(),
        name: "",
        quote: "",
        image: "",
      },
    ]);
  }

  // Real Cloudinary upload — this used to store the raw file as a base64
  // data: URL directly in the theme JSON instead. That bloated every save
  // with the full image bytes, and meant this avatar could never show up
  // in the Media library (nothing was ever actually uploaded to look up).
  async function onImageFile(id: string, file: File | null) {
    if (!file) return;
    if (!siteId) {
      toast({
        title: "Still loading this site",
        description: "Wait a moment and try again.",
        variant: "info",
      });
      return;
    }
    setUploadingId(id);
    try {
      const uploaded = await uploadSiteMedia(siteId, file, "other");
      patch(id, { image: uploaded.url });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setUploadingId(null);
    }
  }

  function onImagePick(id: string, images: MediaImage[]) {
    if (images[0]) patch(id, { image: images[0].url });
  }

  return (
    <div className="flex flex-col gap-4">
      <EditorField label="Section title">
        <EditorInput value={title} onChange={onTitleChange} />
      </EditorField>

      <div className="flex items-center justify-between gap-2">
        <EditorLabel>Testimonials</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {list.length} total
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {list.map((item, index) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-xl bg-search-bg p-3"
          >
            <div className="flex items-center gap-3">
              {/* Avatar circle — + inside; hover + when image is set */}
              <MediaSourceMenu
                siteId={siteId}
                category="other"
                onUploadFiles={(files) => onImageFile(item.id, files[0] ?? null)}
                onPickImages={(images) => onImagePick(item.id, images)}
              >
                {(open) => (
                  <button
                    type="button"
                    onClick={open}
                    disabled={uploadingId === item.id}
                    className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface disabled:opacity-60"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name || "Client"}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : null}

                    <span
                      className={[
                        "relative z-10 flex size-full items-center justify-center transition-opacity",
                        item.image
                          ? "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                          : "text-slate-400",
                      ].join(" ")}
                    >
                      <Plus className="size-5" strokeWidth={2} />
                    </span>
                  </button>
                )}
              </MediaSourceMenu>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted">
                  Client {index + 1}
                </p>
              </div>

              <button
                type="button"
                aria-label="Remove testimonial"
                onClick={() => remove(item.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </div>

            <EditorField label="Name">
              <EditorInput
                value={item.name}
                onChange={(v) => patch(item.id, { name: v })}
                placeholder="Customer name"
              />
            </EditorField>
            <EditorField label="Quote">
              <EditorInput
                value={item.quote}
                onChange={(v) => patch(item.id, { quote: v })}
                placeholder="What they said…"
              />
            </EditorField>

            {item.image ? (
              <button
                type="button"
                onClick={() => patch(item.id, { image: "" })}
                className="self-start text-[11px] font-semibold text-muted transition-colors hover:text-red-500"
              >
                Remove photo
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        Add testimonial
      </button>
    </div>
  );
}
