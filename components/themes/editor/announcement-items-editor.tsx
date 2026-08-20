"use client";

import { Plus } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { EditorField, EditorInput } from "./editor-field";
import { announcementDividerPresets } from "./editor-types";

type AnnouncementItemsEditorProps = {
  items: string[];
  divider: string;
  onItemsChange: (items: string[]) => void;
  onDividerChange: (divider: string) => void;
};

/** Repeatable marquee segments + divider glyph picker — same list-edit
 * pattern as nav links / testimonials, scoped to plain strings. */
export function AnnouncementItemsEditor({
  items,
  divider,
  onItemsChange,
  onDividerChange,
}: AnnouncementItemsEditorProps) {
  const list = items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-muted">Banner segments</p>
          <button
            type="button"
            onClick={() => onItemsChange([...list, "New segment"])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {list.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              <span className="w-4 text-[10px] font-semibold text-slate-400">
                {index + 1}
              </span>
              <EditorInput
                value={item}
                placeholder="Segment text"
                onChange={(v) =>
                  onItemsChange(list.map((t, i) => (i === index ? v : t)))
                }
              />
              <button
                type="button"
                aria-label="Remove segment"
                disabled={list.length <= 1}
                onClick={() => onItemsChange(list.filter((_, i) => i !== index))}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500 disabled:opacity-30"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <EditorField label="Divider">
        <div className="flex flex-wrap gap-1.5">
          {announcementDividerPresets.map((glyph) => {
            const active = divider === glyph;
            return (
              <button
                key={glyph}
                type="button"
                onClick={() => onDividerChange(glyph)}
                aria-pressed={active}
                className={[
                  "inline-flex size-9 items-center justify-center rounded-md text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "bg-search-bg text-foreground hover:bg-border",
                ].join(" ")}
              >
                {glyph}
              </button>
            );
          })}
        </div>
      </EditorField>
    </div>
  );
}
