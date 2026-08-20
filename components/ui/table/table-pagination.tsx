"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [1];

  if (page > 3) pages.push("…");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (page < totalPages - 2) pages.push("…");

  pages.push(totalPages);
  return pages;
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-xs text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-foreground">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-search-bg disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>

        {pages.map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-muted-soft"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={[
                "inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                item === page
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-search-bg",
              ].join(" ")}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-search-bg disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
