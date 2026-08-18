import type { CategoryStatus } from "./categories-data";

const styles: Record<CategoryStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Inactive: "bg-slate-100 text-slate-500",
};

type CategoryStatusBadgeProps = {
  status: CategoryStatus;
};

export function CategoryStatusBadge({ status }: CategoryStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      ].join(" ")}
    >
      {status}
    </span>
  );
}
