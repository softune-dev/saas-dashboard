import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  actions?: ReactNode;
  /** Keep title and actions on one row even on mobile (title left, actions
   * right), instead of the default stack-then-row. Only safe for a single
   * compact action (one button) — a wider action cluster (search bar,
   * filters) still needs the default stacking so it has room to wrap. */
  actionsInline?: boolean;
};

/** Route title on the left; optional actions (filters, etc.) on the right. */
export function PageHeading({ title, actions, actionsInline = false }: PageHeadingProps) {
  return (
    <div
      className={[
        "flex gap-2 sm:gap-3",
        actionsInline
          ? "flex-row items-center justify-between"
          : "flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
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
