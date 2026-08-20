import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  actions?: ReactNode;
};

/** Route title on the left; optional actions (filters, etc.) on the right. */
export function PageHeading({ title, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
      <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      {actions ? (
        <div className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
