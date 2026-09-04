"use client";

import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { useLanguage } from "@/components/providers/language-provider";

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
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title={t("Site Settings")} actions={actions} />

      <section className="min-w-0 flex-1 rounded-md bg-surface p-4 sm:p-5">
        <h2 className="mb-5 text-base font-semibold text-foreground">
          {t(title)}
        </h2>
        {children}
      </section>
    </div>
  );
}
