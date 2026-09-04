/** Loading placeholder shaped like DataTable, shown while the initial fetch
 * for a page is in flight — distinct from DataTable's own `emptyMessage`,
 * which only applies once real data has actually loaded and come back
 * empty (zero results vs. "still finding out"). */
export function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-border bg-surface">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-search-bg/60">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-border dark:border-transparent last:border-b-0">
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-4 py-3.5">
                    <div
                      className="h-3.5 animate-pulse rounded-full bg-search-bg"
                      style={{ width: c === 0 ? "70%" : "45%" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
