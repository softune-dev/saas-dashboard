import type { OrderStatus } from "@/lib/api/commerce";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-blue-50 text-blue-600",
  fulfilled: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-500",
  refunded: "bg-slate-100 text-slate-500",
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
        styles[status] ?? "bg-slate-100 text-slate-500",
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
