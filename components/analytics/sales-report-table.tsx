"use client";

import { Calendar } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { formatTaka } from "@/lib/format";
import type { SalesReportRow } from "@/lib/api/analytics";

export function SalesReportTable({ rows }: { rows: SalesReportRow[] }) {
  const { t } = useLanguage();

  const columns: TableColumn<SalesReportRow>[] = [
    {
      id: "period",
      header: t("Period"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <Calendar className="size-4 text-muted" strokeWidth={2} />
          {row.period}
        </span>
      ),
    },
    {
      id: "orders",
      header: t("Orders"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="tabular-nums font-medium">{row.orders}</span>
      ),
    },
    {
      id: "customers",
      header: t("Customers"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="tabular-nums font-medium">{row.customers}</span>
      ),
    },
    {
      id: "revenue",
      header: t("Revenue"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="font-semibold text-foreground">
          {formatTaka(row.revenue_cents / 100)}
        </span>
      ),
    },
    {
      id: "refunds",
      header: t("Refunds"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="text-red-500">{formatTaka(row.refunds_cents / 100)}</span>
      ),
    },
    {
      id: "net",
      header: t("Net Sales"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="font-semibold text-emerald-600">
          {formatTaka(row.net_cents / 100)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.period}
      emptyMessage={t("No sales report data")}
    />
  );
}
