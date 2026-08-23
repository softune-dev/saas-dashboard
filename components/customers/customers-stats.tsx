import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import type { CustomerOut } from "@/lib/api/customers";

/** Real counts from the customers list page — no order totals here (those
 * require per-customer order aggregation, which only the detail view does),
 * just what's cheap to compute from the list response itself. */
export function CustomersStats({
  customers,
  total,
}: {
  customers: CustomerOut[];
  total: number;
}) {
  const withEmail = customers.filter((c) => c.email).length;
  const withoutEmail = customers.length - withEmail;

  const stats: StatCardData[] = [
    {
      id: "total",
      title: "Total Customers",
      value: String(total),
      icon: "/sidebar/customers.svg",
    },
    {
      id: "with-email",
      title: "With Email",
      value: String(withEmail),
      icon: "/sidebar/account.svg",
    },
    {
      id: "phone-only",
      title: "Phone Only",
      value: String(withoutEmail),
      icon: "/sidebar/wallet.svg",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} compact />
      ))}
    </div>
  );
}
