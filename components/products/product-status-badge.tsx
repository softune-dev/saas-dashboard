import type { ProductStatus } from "./products-data";

const styles: Record<ProductStatus, string> = {
  Published: "bg-emerald-50 text-emerald-600",
  Draft: "bg-amber-50 text-amber-600",
  Archived: "bg-slate-100 text-slate-500",
};

type ProductStatusBadgeProps = {
  status: ProductStatus;
};

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
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
