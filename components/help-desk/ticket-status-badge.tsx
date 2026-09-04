import { useLanguage } from "@/components/providers/language-provider";
import type { TicketPriority, TicketStatus } from "@/lib/api/help-desk";

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-500/10 text-blue-600",
  "In Progress": "bg-amber-500/10 text-amber-600",
  Replied: "bg-emerald-500/10 text-emerald-600",
  Resolved: "bg-primary/10 text-primary",
  Closed: "bg-search-bg text-muted",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-search-bg text-muted",
  Medium: "bg-amber-500/10 text-amber-600",
  High: "bg-rose-500/10 text-red-500",
};

export function TicketStatusBadge({
  status,
}: {
  status: TicketStatus | string;
}) {
  const { t } = useLanguage();
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status as TicketStatus] ?? "bg-search-bg text-muted",
      ].join(" ")}
    >
      {t(status)}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  const { t } = useLanguage();
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        priorityStyles[priority],
      ].join(" ")}
    >
      {t(priority)}
    </span>
  );
}
