"use client";

import { ChevronDown, Download } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { downloadCsv, downloadJson, exportAsPdf } from "@/lib/export";
import { formatTaka } from "@/lib/format";
import type { AnalyticsOut } from "@/lib/api/analytics";

/** Every field here is real, already-fetched analytics data (see
 * app/api/analytics.py's get_analytics) — export just reshapes it into
 * CSV/JSON/PDF, nothing invented. */
export function ExportMenu({
  data,
  siteName,
  periodLabel,
}: {
  data: AnalyticsOut;
  siteName: string;
  periodLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `${siteName.toLowerCase().replace(/\s+/g, "-")}-analytics-${stamp}`;

  function handleCsv() {
    const rows: (string | number)[][] = [
      ["Summary", periodLabel],
      ["Revenue", formatTaka((data.revenue.cents ?? 0) / 100)],
      ["Orders", data.orders.count ?? 0],
      ["Avg. Order Value", formatTaka((data.aov.cents ?? 0) / 100)],
      ["Refund Rate", `${data.refund_rate.percent ?? 0}%`],
      [],
      ["Sales Report"],
      ["Period", "Orders", "Customers", "Revenue", "Refunds", "Net Sales"],
      ...data.sales_report.map((r) => [
        r.period,
        r.orders,
        r.customers,
        (r.revenue_cents / 100).toFixed(2),
        (r.refunds_cents / 100).toFixed(2),
        (r.net_cents / 100).toFixed(2),
      ]),
      [],
      ["Best Selling Products"],
      ["Product", "Category", "Sold", "Revenue"],
      ...data.best_sellers.map((b) => [
        b.name,
        b.category,
        b.sold,
        (b.revenue_cents / 100).toFixed(2),
      ]),
      [],
      ["Best Selling Categories"],
      ["Category", "Revenue", "Share"],
      ...data.category_shares.map((c) => [
        c.name,
        (c.revenue_cents / 100).toFixed(2),
        `${c.percent}%`,
      ]),
    ];
    downloadCsv(`${baseName}.csv`, rows);
    setOpen(false);
  }

  function handleJson() {
    downloadJson(`${baseName}.json`, data);
    setOpen(false);
  }

  function handlePdf() {
    const salesRows = data.sales_report
      .map(
        (r) =>
          `<tr><td>${r.period}</td><td>${r.orders}</td><td>${r.customers}</td><td>${formatTaka(r.revenue_cents / 100)}</td><td>${formatTaka(r.refunds_cents / 100)}</td><td>${formatTaka(r.net_cents / 100)}</td></tr>`,
      )
      .join("");
    const sellerRows = data.best_sellers
      .map(
        (b) =>
          `<tr><td>${b.name}</td><td>${b.category}</td><td>${b.sold}</td><td>${formatTaka(b.revenue_cents / 100)}</td></tr>`,
      )
      .join("");
    exportAsPdf(
      `${siteName} — Analytics Report`,
      `<p class="meta">${periodLabel}</p>
      <div class="stats">
        <div class="stat"><div class="stat-value">${formatTaka((data.revenue.cents ?? 0) / 100)}</div><div class="stat-label">REVENUE</div></div>
        <div class="stat"><div class="stat-value">${data.orders.count ?? 0}</div><div class="stat-label">ORDERS</div></div>
        <div class="stat"><div class="stat-value">${formatTaka((data.aov.cents ?? 0) / 100)}</div><div class="stat-label">AVG. ORDER VALUE</div></div>
        <div class="stat"><div class="stat-value">${data.refund_rate.percent ?? 0}%</div><div class="stat-label">REFUND RATE</div></div>
      </div>
      <h2>Sales Report</h2>
      <table><thead><tr><th>Period</th><th>Orders</th><th>Customers</th><th>Revenue</th><th>Refunds</th><th>Net</th></tr></thead><tbody>${salesRows}</tbody></table>
      <h2>Best Selling Products</h2>
      <table><thead><tr><th>Product</th><th>Category</th><th>Sold</th><th>Revenue</th></tr></thead><tbody>${sellerRows}</tbody></table>`,
    );
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <PrimaryButton
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 sm:px-4"
        aria-label="Export"
      >
        <Download className="size-4" strokeWidth={2} />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown
          className={[
            "size-3.5 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          strokeWidth={2}
        />
      </PrimaryButton>

      {open ? (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 z-30 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-xl dark:border-transparent">
          <button
            type="button"
            onClick={handleCsv}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <MaskIcon src="/sidebar/note.svg" className="size-4 text-muted-soft transition-colors group-hover:text-primary" />
            CSV (Excel)
          </button>
          <button
            type="button"
            onClick={handlePdf}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <MaskIcon src="/sidebar/note.svg" className="size-4 text-muted-soft transition-colors group-hover:text-primary" />
            PDF
          </button>
          <button
            type="button"
            onClick={handleJson}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <MaskIcon src="/sidebar/note.svg" className="size-4 text-muted-soft transition-colors group-hover:text-primary" />
            JSON
          </button>
        </div>
      ) : null}
    </div>
  );
}
