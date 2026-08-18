"use client";

import { BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { DateRangePill, type DateRange } from "@/components/ui/date-range-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PeriodPill } from "@/components/ui/period-pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAnalyticsSWR } from "@/lib/api/analytics";
import { AnalyticsStats } from "./analytics-stats";
import { BestSellers } from "./best-sellers";
import { CategoryPieChart } from "./category-pie-chart";
import { RevenueCurveChart } from "./revenue-curve-chart";
import { SalesReportTable } from "./sales-report-table";

const defaultRange: DateRange = {
  from: new Date(2026, 0, 1),
  to: new Date(2026, 7, 31),
};

// app/api/analytics.py's get_analytics only accepts a trailing "last N
// weeks (from today)" window, not arbitrary from/to dates — so the picker's
// span is converted to a week count rather than sent as literal dates. The
// backend caps at 26 weeks (~6 months); clamped here so an aggressive range
// pick can't 422.
function weeksFromRange(range: DateRange): number {
  const days = Math.round(
    (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
  );
  const weeks = Math.ceil(days / 7);
  return Math.min(26, Math.max(1, weeks));
}

export function AnalyticsView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const [range, setRange] = useState<DateRange>(defaultRange);
  const siteId = currentSite?.id ?? null;

  const { data, error, isLoading } = useAnalyticsSWR(siteId, weeksFromRange(range));
  const loading = sessionLoading || (isLoading && currentSite);
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Failed to load analytics"
    : null;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Analytics"
        actions={
          <>
            <DateRangePill value={range} onChange={setRange} />
            <PrimaryButton>
              <Download className="size-4" strokeWidth={2} />
              Export
            </PrimaryButton>
          </>
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={BarChart3}
          title="No site yet"
          description="Create a site from a template in Themes to see analytics."
        />
      ) : loading ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="h-[280px] animate-pulse rounded-md bg-white" />
            <div className="h-[280px] animate-pulse rounded-md bg-white" />
          </div>
        </>
      ) : errorMessage ? (
        <EmptyState icon={BarChart3} title="Couldn't load analytics" description={errorMessage} />
      ) : data ? (
        <>
          <AnalyticsStats data={data} />

          {/* Curve + category pie */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <section className="rounded-md bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Revenue Trend
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Weekly sales performance curve
                  </p>
                </div>
                <PeriodPill label={`Last ${weeksFromRange(range)} Weeks`} />
              </div>
              <RevenueCurveChart curve={data.revenue_curve} />
            </section>

            <section className="rounded-md bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  Best Selling Categories
                </h2>
                <PeriodPill />
              </div>
              <CategoryPieChart shares={data.category_shares} />
            </section>
          </div>

          {/* Best products + sales report */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <section className="rounded-md bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  Best Selling Products
                </h2>
                <PeriodPill />
              </div>
              <BestSellers items={data.best_sellers} />
            </section>

            <section className="rounded-md bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Sales Report
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Weekly breakdown with net sales
                  </p>
                </div>
                <PrimaryButton className="!px-3 !py-1.5 text-xs">
                  <Download className="size-3.5" strokeWidth={2} />
                  Export CSV
                </PrimaryButton>
              </div>
              <SalesReportTable rows={data.sales_report} />
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
