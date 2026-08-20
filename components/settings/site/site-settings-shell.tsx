import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { SiteSettingsNav } from "./site-settings-nav";

type SiteSettingsShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SiteSettingsShell({
  title,
  actions,
  children,
}: SiteSettingsShellProps) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Site Settings" actions={actions} />

      <div className="flex min-h-0 flex-col gap-3 sm:flex-row sm:items-start">
        <SiteSettingsNav />
        <section className="min-w-0 flex-1 rounded-md bg-surface p-4 sm:p-5">
          <h2 className="mb-5 text-base font-semibold text-foreground">
            {title}
          </h2>
          {children}
        </section>
      </div>
    </div>
  );
}
