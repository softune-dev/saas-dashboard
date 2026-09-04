import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { useLanguage } from "@/components/providers/language-provider";
import { formatTaka } from "@/lib/format";
import type { OrderOut } from "@/lib/api/commerce";
import { bucketByCalendarMonth, monthOverMonth } from "@/lib/trends";

export function OrdersStats({
  orders,
  totalCount,
}: {
  orders: OrderOut[];
  /** Backend's Page.total — may exceed orders.length if more pages exist. */
  totalCount: number;
}) {
  const { t } = useLanguage();
  const pending = orders.filter((o) => o.status === "pending").length;
  const fulfilled = orders.filter((o) => o.status === "fulfilled").length;
  // Revenue over the fetched page only — honest about the limit rather than
  // inventing a server-side aggregate the backend doesn't expose yet.
  const revenueCents = orders.reduce((sum, o) => sum + o.total_cents, 0);

  // Flow metrics: this calendar month vs last calendar month (not cumulative).
  // Pending/Fulfilled are point-in-time status counts — no snapshot history.
  const { thisMonth, lastMonth } = bucketByCalendarMonth(orders);
  const thisMonthCount = thisMonth.length;
  const lastMonthCount = lastMonth.length;
  const thisMonthRevenue = thisMonth.reduce((s, o) => s + o.total_cents, 0);
  const lastMonthRevenue = lastMonth.reduce((s, o) => s + o.total_cents, 0);

  const ordersTrend = monthOverMonth(thisMonthCount, lastMonthCount);
  const revenueTrend = monthOverMonth(
    thisMonthRevenue,
    lastMonthRevenue,
    (cents) => formatTaka(cents / 100),
  );

  const stats: StatCardData[] = [
    {
      id: "total",
      title: t("Total Orders"),
      value: String(totalCount),
      icon: "/sidebar/orders.svg",
      ...ordersTrend,
    },
    {
      id: "pending",
      title: t("Pending"),
      value: String(pending),
      icon: "/sidebar/shop-bag2.svg",
    },
    {
      id: "fulfilled",
      title: t("Fulfilled"),
      value: String(fulfilled),
      icon: "/sidebar/shop-bag.svg",
    },
    {
      id: "revenue",
      title: t("Order Revenue"),
      value: formatTaka(revenueCents / 100),
      icon: "/sidebar/wallet.svg",
      ...revenueTrend,
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
