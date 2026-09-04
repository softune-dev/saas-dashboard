"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PageHeading } from "@/components/ui/page-heading";
import { ThemesGrid } from "./themes-grid";

export function ThemesView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title={t("Themes")} />
      <ThemesGrid />
    </div>
  );
}
