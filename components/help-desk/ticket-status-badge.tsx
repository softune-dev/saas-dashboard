import type { TicketPriority, TicketStatus } from "./help-data";

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-50 text-blue-600",
  "In Progress": "bg-amber-50 text-amber-600",
  Resolved: "bg-emerald-50 text-emerald-600",
  Closed: "bg-slate-100 text-slate-500",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-slate-100 text-slate-500",
  Medium: "bg-amber-50 text-amber-600",
  High: "bg-red-50 text-red-500",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        priorityStyles[priority],
      ].join(" ")}
    >
      {priority}
    </span>
  );
}
