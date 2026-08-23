import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { formatTaka } from "@/lib/format";
import type { ProductOut } from "@/lib/api/commerce";
import {
  countAsOfEndOfLastMonth,
  monthOverMonth,
} from "@/lib/trends";

export function ProductsStats({
  products,
  totalCount,
}: {
  products: ProductOut[];
  /** Backend's Page.total — may exceed products.length if there are more
   * pages than were fetched. */
  totalCount: number;
}) {
  const active = products.filter((p) => p.is_active).length;
  const outOfStock = products.filter((p) => p.track_stock && p.stock <= 0).length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + p.price_cents * p.stock,
    0,
  );

  // Stock metric from the fetched page's created_at. Baseline can undercount
  // if totalCount > products.length (same 100-row ceiling as the list page).
  const lastMonthTotal = countAsOfEndOfLastMonth(products);
  const totalTrend = monthOverMonth(totalCount, lastMonthTotal);

  const stats: StatCardData[] = [
    {
      id: "total",
      title: "Total Products",
      value: String(totalCount),
      icon: "/sidebar/products.svg",
      ...totalTrend,
    },
    {
      id: "active",
      title: "Active",
      value: String(active),
      icon: "/sidebar/shop-bag.svg",
    },
    {
      id: "out-of-stock",
      title: "Out of Stock",
      value: String(outOfStock),
      icon: "/sidebar/orders.svg",
    },
    {
      id: "inventory-value",
      title: "Inventory Value",
      value: formatTaka(inventoryValue / 100),
      icon: "/sidebar/wallet.svg",
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
