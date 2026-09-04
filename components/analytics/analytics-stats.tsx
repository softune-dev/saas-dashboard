import { StatCard } from "@/components/dashboard/stats/stat-card";
import { useLanguage } from "@/components/providers/language-provider";
import { formatTaka } from "@/lib/format";
import type { AnalyticsOut } from "@/lib/api/analytics";

export function AnalyticsStats({ data }: { data: AnalyticsOut }) {
  const { t } = useLanguage();
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
    {
      id: "visits",
      title: "Visitors",
      value: String(data.visits.count ?? 0),
      changePercent: data.visits.change_percent ?? undefined,
      icon: "/sidebar/analytics.svg",
    },
    {
      id: "conversion_rate",
      title: "Conversion Rate",
      value: `${(data.conversion_rate.percent ?? 0).toFixed(1)}%`,
      changePercent: data.conversion_rate.change_percent ?? undefined,
      icon: "/sidebar/analytics.svg",
    },
    {
      id: "profit",
      title: "Profit",
      value: formatTaka((data.profit.cents ?? 0) / 100),
      changePercent: data.profit.change_percent ?? undefined,
      icon: "/sidebar/wallet.svg",
    },
  ];

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} compact />
        ))}
      </div>
      {data.cost_data_coverage_percent < 100 ? (
        <p className="text-xs text-muted">
          {t(
            "Profit is based on {pct}% of this period's revenue — set a Cost Price on more products for a fuller number.",
          ).replace("{pct}", data.cost_data_coverage_percent.toFixed(0))}
        </p>
      ) : null}
    </div>
  );
}
