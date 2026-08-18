import type { InvoiceStatus } from "./billing-data";

const styles: Record<InvoiceStatus, string> = {
  Paid: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  Failed: "bg-red-50 text-red-500",
};

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
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
