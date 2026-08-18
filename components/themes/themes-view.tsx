import { PageHeading } from "@/components/ui/page-heading";
import { ThemesGrid } from "./themes-grid";

export function ThemesView() {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Themes" />
      <ThemesGrid />
    </div>
  );
}
