import { StatCard } from "@/components/dashboard/stats/stat-card";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { useLanguage } from "@/components/providers/language-provider";
import type { CategoryOut } from "@/lib/api/commerce";
import {
  countAsOfEndOfLastMonth,
  monthOverMonth,
} from "@/lib/trends";

export function CategoriesStats({
  categories,
  productCounts,
}: {
  categories: CategoryOut[];
  /** Total products across all categories, for the "Listed Products" card —
   * passed in rather than computed here since it comes from a separate
   * products fetch the parent already has to make. */
  productCounts: number;
}) {
  const { t } = useLanguage();
  const active = categories.filter((c) => c.is_active).length;
  const inactive = categories.length - active;

  // Stock metric: last month = how many categories already existed before
  // this calendar month started. Active/Inactive/Listed Products have no
  // historical snapshots — leave those without a trend.
  const lastMonthTotal = countAsOfEndOfLastMonth(categories);
  const totalTrend = monthOverMonth(categories.length, lastMonthTotal);

  const stats: StatCardData[] = [
    {
      id: "total",
      title: t("Total Categories"),
      value: String(categories.length),
      icon: "/sidebar/categories.svg",
      ...totalTrend,
    },
    {
      id: "active",
      title: t("Active"),
      value: String(active),
      icon: "/sidebar/products.svg",
    },
    {
      id: "inactive",
      title: t("Inactive"),
      value: String(inactive),
      icon: "/sidebar/orders.svg",
    },
    {
      id: "products",
      title: t("Listed Products"),
      value: String(productCounts),
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
