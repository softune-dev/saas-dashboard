"use client";

import { LayoutDashboard } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { TableSkeleton } from "@/components/ui/table";
import { useCategoriesSWR, useOrdersSWR, useProductsSWR } from "@/lib/api/commerce";
import { formatTaka } from "@/lib/format";
import {
  bucketByCalendarMonth,
  bucketRevenueByMonth,
  countAsOfEndOfLastMonth,
  monthOverMonth,
} from "@/lib/trends";
import { RecentOrders } from "./recent-orders/recent-orders";
import { SalesSection } from "./sales/sales-section";
import type { StatCardData } from "./stats/stats-data";
import { StatsGrid } from "./stats/stats-grid";

export function DashboardView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const siteId = currentSite?.id ?? null;

  // limit 100 on products so created_at is available for stock MoM (same
  // practical ceiling as Products/Orders pages). Page.total still drives
  // the displayed count.
  const { data: productPage, isLoading: productsLoading } = useProductsSWR(siteId, {
    limit: 100,
  });
  const { data: categories, isLoading: categoriesLoading } = useCategoriesSWR(siteId);
  // 500, not 100 — the Sales Analysis chart below buckets these into 6
  // calendar months; 100 orders covers well under 6 months once a store has
  // real volume, silently leaving older months blank (see app/api/commerce.py's
  // list_orders for the matching backend cap).
  const {
    data: ordersPage,
    error: ordersError,
    isLoading: ordersLoading,
  } = useOrdersSWR(siteId, { limit: 500 });

  const loading = productsLoading || categoriesLoading || ordersLoading;
  const error = ordersError
    ? ordersError instanceof Error
      ? ordersError.message
      : "Failed to load dashboard"
    : null;

  const orders = ordersPage?.items ?? [];
  const products = productPage?.items ?? [];
  const cats = categories ?? [];
  const revenueCents = orders.reduce((sum, o) => sum + o.total_cents, 0);

  const productsTrend = monthOverMonth(
    productPage?.total ?? 0,
    countAsOfEndOfLastMonth(products),
  );
  const categoriesTrend = monthOverMonth(
    cats.length,
    countAsOfEndOfLastMonth(cats),
  );

  const { thisMonth, lastMonth } = bucketByCalendarMonth(orders);
  const ordersTrend = monthOverMonth(thisMonth.length, lastMonth.length);
  const revenueTrend = monthOverMonth(
    thisMonth.reduce((s, o) => s + o.total_cents, 0),
    lastMonth.reduce((s, o) => s + o.total_cents, 0),
    (cents) => formatTaka(cents / 100),
  );

  const stats: StatCardData[] = ordersPage
    ? [
        {
          id: "products",
          title: "Total Products",
          value: String(productPage?.total ?? 0),
          icon: "/sidebar/products.svg",
          ...productsTrend,
        },
        {
          id: "categories",
          title: "Categories",
          value: String(cats.length),
          icon: "/sidebar/categories.svg",
          ...categoriesTrend,
        },
        {
          id: "orders",
          title: "Total Orders",
          value: String(ordersPage.total),
          icon: "/sidebar/orders.svg",
          ...ordersTrend,
        },
        {
          id: "revenue",
          title: "Total Revenue",
          value: formatTaka(revenueCents / 100),
          icon: "/sidebar/wallet.svg",
          ...revenueTrend,
        },
      ]
    : [];
  const recentOrders = orders.slice(0, 10);
  const revenueBars = bucketRevenueByMonth(orders);

  const showSkeleton = sessionLoading || (loading && currentSite && stats.length === 0);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Dashboard" />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No site yet"
          description="Create a site from a template in Themes to see store overview stats."
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-white" />
            ))}
          </div>
          <TableSkeleton columns={6} />
        </>
      ) : error ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Couldn't load dashboard"
          description={error}
        />
      ) : (
        <>
          <StatsGrid stats={stats} />
          <SalesSection
            bars={revenueBars}
            hasOrders={orders.length > 0}
            productsCount={productPage?.total ?? 0}
            categoriesCount={cats.length}
          />
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="No orders yet"
              description="Recent storefront orders will appear here once customers start buying."
            />
          ) : (
            <RecentOrders orders={recentOrders} />
          )}
        </>
      )}
    </div>
  );
}
