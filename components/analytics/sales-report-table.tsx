"use client";

import { DataTable, type TableColumn } from "@/components/ui/table";
import { formatTaka } from "@/lib/format";
import type { SalesReportRow } from "@/lib/api/analytics";

const columns: TableColumn<SalesReportRow>[] = [
  {
    id: "period",
    header: "Period",
    cell: (row) => (
      <span className="font-semibold text-foreground">{row.period}</span>
    ),
  },
  {
    id: "orders",
    header: "Orders",
    cell: (row) => (
      <span className="tabular-nums font-medium">{row.orders}</span>
    ),
  },
  {
    id: "customers",
    header: "Customers",
    cell: (row) => (
      <span className="tabular-nums font-medium">{row.customers}</span>
    ),
  },
  {
    id: "revenue",
    header: "Revenue",
    cell: (row) => (
      <span className="font-semibold text-foreground">
        {formatTaka(row.revenue_cents / 100)}
      </span>
    ),
  },
  {
    id: "refunds",
    header: "Refunds",
    cell: (row) => (
      <span className="text-red-500">{formatTaka(row.refunds_cents / 100)}</span>
    ),
  },
  {
    id: "net",
    header: "Net Sales",
    cell: (row) => (
      <span className="font-semibold text-emerald-600">
        {formatTaka(row.net_cents / 100)}
      </span>
    ),
  },
];

export function SalesReportTable({ rows }: { rows: SalesReportRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.period}
      emptyMessage="No sales report data"
    />
  );
}
