import type { FulfillmentStatus } from "@/lib/dropship-mock";

const STYLES: Record<FulfillmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  shipped: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-rose-500/10 text-rose-600",
};

const LABELS: Record<FulfillmentStatus, string> = {
  pending: "Pending",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
