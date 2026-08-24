"use client";

import { ImageIcon, MessageSquareQuote, Plus, Upload } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { EditorField, EditorInput, EditorLabel } from "./editor-field";
import type { EditorTestimonial } from "./editor-types";
import { registerPendingUpload } from "./pending-uploads";

function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function TestimonialsEditor({
  siteId,
  mode,
  title,
  items,
  onModeChange,
  onTitleChange,
  onChange,
}: {
  siteId: string | null;
  mode: "cards" | "images";
  title: string;
  items: EditorTestimonial[];
  onModeChange: (mode: "cards" | "images") => void;
  onTitleChange: (v: string) => void;
  onChange: (items: EditorTestimonial[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];
  const isImages = mode === "images";

  function patch(id: string, partial: Partial<EditorTestimonial>) {
    onChange(list.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  function remove(id: string) {
    onChange(list.filter((t) => t.id !== id));
  }

  function add() {
    onChange([...list, { id: newId(), name: "", quote: "", image: "" }]);
  }

  // Local-only: registers the file and gets an instant blob: preview URL
  // back — the real Cloudinary upload happens once, right before Publish
  // (see pending-uploads.ts).
  function onImageFile(id: string, file: File | null) {
    if (!file) return;
    patch(id, { image: registerPendingUpload(file, "other") });
  }

  return (
    <div className="flex flex-col gap-4">
      <EditorField label="Section title">
        <EditorInput value={title} onChange={onTitleChange} />
      </EditorField>

      <div className="flex flex-col gap-1.5">
        <EditorLabel>Show as</EditorLabel>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onModeChange("cards")}
            className={[
              "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-colors",
              !isImages
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted hover:border-muted",
            ].join(" ")}
          >
            <MessageSquareQuote className="size-3.5" strokeWidth={2} />
            Cards
          </button>
          <button
            type="button"
            onClick={() => onModeChange("images")}
            className={[
              "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-colors",
              isImages
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted hover:border-muted",
            ].join(" ")}
          >
            <ImageIcon className="size-3.5" strokeWidth={2} />
            Screenshots
          </button>
        </div>
        <p className="text-[11px] text-muted-soft">
          {isImages
            ? "Upload real WhatsApp/Messenger screenshots from customers instead of typing a quote."
            : "Name, quote, and an optional photo for each customer."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <EditorLabel>Testimonials</EditorLabel>
        <span className="text-[11px] font-medium text-slate-400">
          {list.length} total
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {list.map((item, index) =>
          isImages ? (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-search-bg p-3"
            >
              <MediaSourceMenu
                siteId={siteId}
                category="other"
                onUploadFiles={(files) => onImageFile(item.id, files[0] ?? null)}
                onPickImages={(images) => {
                  if (images[0]) patch(item.id, { image: images[0].url });
                }}
              >
                {(open) => (
                  <button
                    type="button"
                    onClick={open}
                    className="group relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt="Screenshot"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <Upload className="size-4 text-slate-400" strokeWidth={1.75} />
                    )}
                    {item.image ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="size-4" strokeWidth={1.75} />
                      </span>
                    ) : null}
                  </button>
                )}
              </MediaSourceMenu>
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted">
                Screenshot {index + 1}
              </p>
              <button
                type="button"
                aria-label="Remove screenshot"
                onClick={() => remove(item.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </li>
          ) : (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl bg-search-bg p-3"
            >
              <div className="flex items-center gap-3">
                <MediaSourceMenu
                  siteId={siteId}
                  category="other"
                  onUploadFiles={(files) => onImageFile(item.id, files[0] ?? null)}
                  onPickImages={(images) => {
                    if (images[0]) patch(item.id, { image: images[0].url });
                  }}
                >
                  {(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface"
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
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        {isImages ? "Add screenshot" : "Add testimonial"}
      </button>
    </div>
  );
}
