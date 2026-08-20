import type { ProductStatus } from "./products-data";

const styles: Record<ProductStatus, string> = {
  Published: "bg-primary/10 text-primary",
  Draft: "bg-amber-500/10 text-amber-600",
  Archived: "bg-search-bg text-muted",
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
