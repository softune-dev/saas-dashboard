import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { formatTaka } from "@/lib/format";
import type { DerivedCustomer } from "./customers-data";

/** Real aggregates from derived customers — no fabricated trends. */
export function CustomersStats({ customers }: { customers: DerivedCustomer[] }) {
  const totalOrders = customers.reduce((n, c) => n + c.orderCount, 0);
  const totalSpent = customers.reduce((n, c) => n + c.spentCents, 0);
  const avgLtv =
    customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;
  const repeat = customers.filter((c) => c.orderCount > 1).length;

  const stats: StatCardData[] = [
    {
      id: "total",
      title: "Total Customers",
      value: String(customers.length),
      icon: "/sidebar/customers.svg",
    },
    {
      id: "orders",
      title: "Orders Placed",
      value: String(totalOrders),
      icon: "/sidebar/orders.svg",
    },
    {
      id: "repeat",
      title: "Repeat Buyers",
      value: String(repeat),
      icon: "/sidebar/account.svg",
    },
    {
      id: "ltv",
      title: "Avg. LTV",
      value: formatTaka(avgLtv / 100),
      icon: "/sidebar/wallet.svg",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
