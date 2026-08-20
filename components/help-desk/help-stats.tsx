"use client";

import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { useHelpTicketsSWR } from "@/lib/api/help-desk";

export function HelpStats() {
  const { data, isLoading } = useHelpTicketsSWR();
  const tickets = data?.items ?? [];

  const open = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed",
  ).length;

  // No "avg. reply time" here — that needs a real agent-reply timestamp,
  // which doesn't exist yet (soft launch, no admin/reply flow — see
  // app/models.py's HelpTicket docstring). Showing three real counts beats
  // a fourth invented one.
  const stats: StatCardData[] = [
    {
      id: "open",
      title: "Open tickets",
      value: isLoading ? "…" : String(open),
      icon: "/sidebar/help-desk.svg",
    },
    {
      id: "progress",
      title: "In progress",
      value: isLoading ? "…" : String(inProgress),
      icon: "/sidebar/inbox.svg",
    },
    {
      id: "resolved",
      title: "Resolved",
      value: isLoading ? "…" : String(resolved),
      icon: "/sidebar/note.svg",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
