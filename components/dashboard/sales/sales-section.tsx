"use client";

import { PeriodPill } from "@/components/ui/period-pill";
import { ShopInfoPanel } from "../shop-info/shop-info-panel";
import { SalesChart } from "./sales-chart";
import type { MonthRevenueBucket } from "@/lib/trends";

type SalesSectionProps = {
  bars: MonthRevenueBucket[];
  hasOrders: boolean;
  productsCount: number;
  categoriesCount: number;
  productImages?: string[];
  categoryImages?: string[];
};

export function SalesSection({
  bars,
  hasOrders,
  productsCount,
  categoriesCount,
  productImages = [],
  categoryImages = [],
}: SalesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* Sales Analysis */}
      <section className="rounded-md bg-surface p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Sales Analysis
          </h2>
          <PeriodPill label="Last 6 Months" />
        </div>
        {hasOrders ? (
          <SalesChart bars={bars.map((b) => ({ label: b.label, amount: b.amountCents / 100 }))} />
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground">No sales yet</p>
            <p className="text-xs text-muted">
              Revenue will chart here once orders start coming in.
            </p>
          </div>
        )}
      </section>

      {/* Shop info */}
      <section className="hidden rounded-md bg-surface p-4 sm:p-5 xl:block">
        <ShopInfoPanel
          productsCount={productsCount}
          categoriesCount={categoriesCount}
          productImages={productImages}
          categoryImages={categoryImages}
        />
      </section>
    </div>
  );
}
