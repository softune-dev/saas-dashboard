import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Whole-panel empty state — for a genuine zero-data condition (no site yet,
 * no products ever created), not a filtered-to-zero search result. Table
 * components keep their own inline `emptyMessage` for that latter case. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-search-bg text-muted">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
