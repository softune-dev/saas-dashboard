import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  actions?: ReactNode;
};

/** Route title on the left; optional actions (filters, etc.) on the right. */
export function PageHeading({ title, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
