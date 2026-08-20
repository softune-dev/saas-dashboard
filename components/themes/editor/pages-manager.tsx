"use client";

import { Eye, MoreVertical, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  pageCatalog,
  type SitePage,
  type SitePageType,
} from "./editor-types";
import { EditorInput } from "./editor-field";

type PagesManagerProps = {
  pages: SitePage[];
  activePageId: string;
  onActivePageChange: (id: string) => void;
  onChangePage: (id: string, patch: Partial<SitePage>) => void;
  onAddPage: (type: SitePageType) => void;
  onRemovePage: (id: string) => void;
};

export function PagesManager({
  pages,
  activePageId,
  onActivePageChange,
  onChangePage,
  onAddPage,
  onRemovePage,
}: PagesManagerProps) {
  const available = pageCatalog.filter(
    (c) => !pages.some((p) => p.type === c.type),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-medium text-muted">Storefront pages</p>

      <ul className="flex flex-col gap-2">
        {pages.map((page, index) => {
          const active = page.id === activePageId;
          const lockedHome = page.type === "home";

          return (
            <li
              key={page.id}
              className={[
                "flex items-center gap-2 rounded-xl border bg-surface px-2 py-2",
                active ? "border-primary bg-primary/5" : "border-border",
              ].join(" ")}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[11px] font-bold tabular-nums text-muted">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <EditorInput
                  value={page.title}
                  onChange={(v) => onChangePage(page.id, { title: v })}
                  placeholder="Page name"
                />
              </div>

              {/* Enabled toggle — same behavior as before */}
              <button
                type="button"
                role="switch"
                aria-checked={page.enabled}
                aria-label={`${page.title} enabled`}
                onClick={() =>
                  onChangePage(page.id, { enabled: !page.enabled })
                }
                disabled={lockedHome}
                className={[
                  "inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-40",
                  page.enabled ? "justify-end bg-primary" : "justify-start bg-border",
                ].join(" ")}
              >
                <span className="size-4 rounded-full bg-[#ffffff] shadow-sm" />
              </button>

              <PageRowMenu
                pageTitle={page.title}
                isActive={active}
                canDelete={!lockedHome}
                onPreview={() => onActivePageChange(page.id)}
                onDelete={() => onRemovePage(page.id)}
              />
            </li>
          );
        })}
      </ul>

      {available.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border dark:border-transparent pt-4">
          <p className="text-[11px] font-medium text-muted">Add page</p>
          <div className="flex flex-col gap-1.5">
            {available.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => onAddPage(item.type)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Plus className="size-4 text-primary" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">All pages added</p>
      )}
    </div>
  );
}

function PageRowMenu({
  pageTitle,
  isActive,
  canDelete,
  onPreview,
  onDelete,
}: {
  pageTitle: string;
  isActive: boolean;
  canDelete: boolean;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`More actions for ${pageTitle}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex size-8 items-center justify-center rounded-md transition-colors",
          open
            ? "bg-search-bg text-foreground"
            : "text-slate-400 hover:bg-search-bg hover:text-foreground",
        ].join(" ")}
      >
        <MoreVertical className="size-4" strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onPreview();
              setOpen(false);
            }}
            className={[
              itemClass,
              isActive
                ? "bg-primary/8 font-medium text-primary"
                : "text-foreground hover:bg-search-bg",
            ].join(" ")}
          >
            <Eye className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>{isActive ? "Viewing" : "View"}</span>
          </button>

          {/* Edit is reserved for a later page-content flow — not clickable yet. */}
          <button
            type="button"
            role="menuitem"
            disabled
            className={`${itemClass} cursor-not-allowed text-muted-soft opacity-60`}
          >
            <Pencil className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!canDelete}
            onClick={() => {
              if (!canDelete) return;
              onDelete();
              setOpen(false);
            }}
            className={[
              itemClass,
              canDelete
                ? "text-red-500 hover:bg-rose-500/10"
                : "cursor-not-allowed text-muted-soft opacity-40",
            ].join(" ")}
          >
            <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
            <span>Delete</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
