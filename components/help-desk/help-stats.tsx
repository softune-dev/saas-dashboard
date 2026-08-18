import { StatCard } from "@/components/dashboard/stats/stat-card";
import { helpStats } from "./help-data";

export function HelpStats() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {helpStats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
