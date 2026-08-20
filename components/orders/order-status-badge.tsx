import type { OrderStatus } from "@/lib/api/commerce";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  paid: "bg-blue-500/10 text-blue-600",
  fulfilled: "bg-primary/10 text-primary",
  cancelled: "bg-rose-500/10 text-red-500",
  refunded: "bg-search-bg text-muted",
};

const labels: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[status] ?? "bg-search-bg text-muted",
      ].join(" ")}
    >
      {labels[status] ?? status}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];
