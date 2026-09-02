import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import type { EventOut } from "@/lib/api/commerce";
import { countAsOfEndOfLastMonth, monthOverMonth } from "@/lib/trends";

export function EventsStats({ events }: { events: EventOut[] }) {
  const active = events.filter((e) => e.is_active).length;
  const inactive = events.length - active;
  const boundProducts = events.reduce((sum, e) => sum + e.product_count, 0);

  const lastMonthTotal = countAsOfEndOfLastMonth(events);
  const totalTrend = monthOverMonth(events.length, lastMonthTotal);

  const stats: StatCardData[] = [
    {
      id: "total",
      title: "Total Events",
      value: String(events.length),
      icon: "/sidebar/events.svg",
      ...totalTrend,
    },
    {
      id: "active",
      title: "Active",
      value: String(active),
      icon: "/sidebar/products.svg",
    },
    {
      id: "inactive",
      title: "Inactive",
      value: String(inactive),
      icon: "/sidebar/orders.svg",
    },
    {
      id: "products",
      title: "Products in Events",
      value: String(boundProducts),
      icon: "/sidebar/shop-bag.svg",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} compact />
      ))}
    </div>
  );
}
