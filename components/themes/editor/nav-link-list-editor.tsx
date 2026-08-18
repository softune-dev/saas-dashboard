"use client";

import { Plus } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { EditorInput } from "./editor-field";
import { toRoutePath, type NavLink } from "./editor-types";

type NavLinkListEditorProps = {
  title: string;
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
  /** Below this count the delete button disables — used by the header's nav
   * links, which must never go empty. Footer link lists have no such floor. */
  minCount?: number;
};

/** Add / edit / remove / reorder-by-position list of {label, path} links.
 * Shared by the header's nav links and the footer's Shop/Company columns —
 * same editing shape in both places, so one implementation. */
export function NavLinkListEditor({
  title,
  links,
  onChange,
  minCount = 0,
}: NavLinkListEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500">{title}</p>
        <button
          type="button"
          onClick={() =>
            onChange([...links, { id: `n-${Date.now()}`, label: "Link", path: "/" }])
          }
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {links.map((link, index) => (
          <li
            key={link.id}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-4 text-[10px] font-semibold text-slate-400">
                {index + 1}
              </span>
              <EditorInput
                value={link.label}
                placeholder="Label"
                onChange={(v) =>
                  onChange(
                    links.map((l) => (l.id === link.id ? { ...l, label: v } : l)),
                  )
                }
              />
              <button
                type="button"
                aria-label="Remove link"
                disabled={links.length <= minCount}
                onClick={() => onChange(links.filter((l) => l.id !== link.id))}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </div>
            {/* Paste-target for the URL shown in the preview's address bar.
             * Full URLs are accepted and reduced to a path on save, since
             * copying from the bar gives an absolute localhost URL. */}
            <EditorInput
              value={link.path ?? ""}
              placeholder="/shop"
              onChange={(v) =>
                onChange(
                  links.map((l) =>
                    l.id === link.id ? { ...l, path: toRoutePath(v) } : l,
                  ),
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
