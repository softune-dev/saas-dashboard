import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  actions?: ReactNode;
  /** Keep title and actions on one row even on mobile (title left, actions
   * right), instead of the default stack-then-row. Only safe for a single
   * compact action (one button) — a wider action cluster (search bar,
   * filters) still needs the default stacking so it has room to wrap. */
  actionsInline?: boolean;
  /** Small pill right after the title, e.g. "Under Development" while a
   * feature (Dropship) is still being built out — same shape as a nav
   * item's `tag` (sidebar/nav-config.ts), amber instead of primary so it
   * reads as a caveat, not a "New" callout. */
  tag?: string;
};

/** Route title on the left; optional actions (filters, etc.) on the right. */
export function PageHeading({ title, actions, actionsInline = false, tag }: PageHeadingProps) {
  return (
    <div
      className={[
        "flex gap-2 sm:gap-3",
        actionsInline
          ? "flex-row items-center justify-between"
          : "flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {tag ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            {tag}
          </span>
        ) : null}
      </div>
      {actions ? (
        <div
          className={[
            "flex min-w-0 max-w-full items-center gap-2",
            actionsInline ? "shrink-0 justify-end" : "flex-wrap justify-start sm:justify-end",
          ].join(" ")}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
