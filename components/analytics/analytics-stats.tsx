import { StatCard } from "@/components/dashboard/stats/stat-card";
import { formatTaka } from "@/lib/format";
import type { AnalyticsOut } from "@/lib/api/analytics";

export function AnalyticsStats({ data }: { data: AnalyticsOut }) {
  const stats = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: formatTaka((data.revenue.cents ?? 0) / 100),
      changePercent: data.revenue.change_percent ?? undefined,
      icon: "/sidebar/wallet.svg",
    },
    {
      id: "orders",
      title: "Orders",
      value: String(data.orders.count ?? 0),
      changePercent: data.orders.change_percent ?? undefined,
      icon: "/sidebar/orders.svg",
    },
    {
      id: "aov",
      title: "Avg. Order Value",
      value: formatTaka((data.aov.cents ?? 0) / 100),
      changePercent: data.aov.change_percent ?? undefined,
      icon: "/sidebar/shop-bag.svg",
    },
    {
      id: "refund_rate",
      title: "Refund Rate",
      value: `${(data.refund_rate.percent ?? 0).toFixed(1)}%`,
      changePercent: data.refund_rate.change_percent ?? undefined,
      icon: "/sidebar/analytics.svg",
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
