import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { DropshipNav } from "./dropship-nav";

type DropshipShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Same shape as components/settings/site/site-settings-shell.tsx. */
export function DropshipShell({ title, actions, children }: DropshipShellProps) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Dropship" actions={actions} tag="Under Development" />

      <div className="flex min-h-0 flex-col gap-3 sm:flex-row sm:items-start">
        <DropshipNav />
        <section className="min-w-0 flex-1 rounded-md bg-surface p-4 sm:p-5">
          <h2 className="mb-5 text-base font-semibold text-foreground">{title}</h2>
          {children}
        </section>
      </div>
    </div>
  );
}
