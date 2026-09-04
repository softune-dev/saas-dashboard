"use client";

import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { useLanguage } from "@/components/providers/language-provider";
import { useHelpTicketsSWR } from "@/lib/api/help-desk";

export function HelpStats() {
  const { t } = useLanguage();
  const { data, isLoading } = useHelpTicketsSWR();
  const tickets = data?.items ?? [];

  const open = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed",
  ).length;

  const stats: StatCardData[] = [
    {
      id: "open",
      title: t("Open tickets"),
      value: isLoading ? "…" : String(open),
      icon: "/sidebar/help-desk.svg",
    },
    {
      id: "progress",
      title: t("In progress"),
      value: isLoading ? "…" : String(inProgress),
      icon: "/sidebar/inbox.svg",
    },
    {
      id: "resolved",
      title: t("Resolved"),
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
