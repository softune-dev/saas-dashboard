import { StatCard } from "./stat-card";
import type { StatCardData } from "./stats-data";

export function StatsGrid({ stats }: { stats: StatCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} compact />
      ))}
    </div>
  );
}
