"use client";

import { Plus } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { EditorField, EditorInput, EditorLabel } from "./editor-field";
import type { EditorTestimonial } from "./editor-types";

function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function TestimonialsEditor({
  title,
  items,
  onTitleChange,
  onChange,
}: {
  title: string;
  items: EditorTestimonial[];
  onTitleChange: (v: string) => void;
  onChange: (items: EditorTestimonial[]) => void;
}) {
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

  function onImageFile(id: string, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      patch(id, { image: result });
    };
    reader.readAsDataURL(file);
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
              <label
                className={[
                  "group relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full",
                  item.image ? "bg-white" : "bg-white",
                ].join(" ")}
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

                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    onImageFile(item.id, e.target.files?.[0] ?? null)
                  }
                />
              </label>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-500">
                  Client {index + 1}
                </p>
              </div>

              <button
                type="button"
                aria-label="Remove testimonial"
                onClick={() => remove(item.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
                className="self-start text-[11px] font-semibold text-slate-500 transition-colors hover:text-red-500"
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
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-slate-200 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        Add testimonial
      </button>
    </div>
  );
}
