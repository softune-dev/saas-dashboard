import type { TicketPriority, TicketStatus } from "@/lib/api/help-desk";

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-500/10 text-blue-600",
  "In Progress": "bg-amber-500/10 text-amber-600",
  Resolved: "bg-primary/10 text-primary",
  Closed: "bg-search-bg text-muted",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-search-bg text-muted",
  Medium: "bg-amber-500/10 text-amber-600",
  High: "bg-rose-500/10 text-red-500",
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
