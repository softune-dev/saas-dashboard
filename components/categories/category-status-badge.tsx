import { useLanguage } from "@/components/providers/language-provider";
import type { CategoryStatus } from "./categories-data";

const styles: Record<CategoryStatus, string> = {
  Active: "bg-primary/10 text-primary",
  Inactive: "bg-search-bg text-muted",
};

type CategoryStatusBadgeProps = {
  status: CategoryStatus;
};

export function CategoryStatusBadge({ status }: CategoryStatusBadgeProps) {
  const { t } = useLanguage();
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      ].join(" ")}
    >
      {t(status)}
    </span>
  );
}
