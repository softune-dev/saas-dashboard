"use client";

import { useEffect, useMemo, useState } from "react";
import { TablePagination } from "./table-pagination";
import type { DataTableProps } from "./types";

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No data found",
  pageSize = 5,
  paginate = true,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  const enabled = paginate && pageSize > 0;
  const totalItems = data.length;
  const totalPages = enabled
    ? Math.max(1, Math.ceil(totalItems / pageSize))
    : 1;

  // Keep page in range when data shrinks (e.g. search filter)
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Reset to first page when the dataset identity changes substantially
  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  const pageData = useMemo(() => {
    if (!enabled) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, enabled, page, pageSize]);

  return (
    <div className="w-full overflow-hidden rounded-md border border-border bg-surface">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border dark:border-transparent bg-search-bg/60">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={[
                    "px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase",
                    col.headerClassName ?? "",
                  ].join(" ")}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border dark:border-transparent last:border-b-0 transition-colors hover:bg-search-bg/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={[
                        "px-4 py-3.5 text-foreground",
                        col.className ?? "",
                      ].join(" ")}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enabled ? (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
