"use client";

import { Download } from "lucide-react";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { invoices, type Invoice } from "./billing-data";
import { InvoiceStatusBadge } from "./invoice-status-badge";

const columns: TableColumn<Invoice>[] = [
  {
    id: "invoiceId",
    header: "Invoice",
    cell: (row) => (
      <span className="font-semibold text-foreground">{row.invoiceId}</span>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => <span className="text-muted">{row.date}</span>,
  },
  {
    id: "plan",
    header: "Plan",
    cell: (row) => <span className="font-medium text-foreground">{row.plan}</span>,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (row) => (
      <span className="font-semibold text-foreground">{row.amount}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <InvoiceStatusBadge status={row.status} />,
  },
  {
    id: "actions",
    header: "Download",
    headerClassName: "text-right",
    className: "text-right",
    cell: (row) => (
      <button
        type="button"
        aria-label={`Download ${row.invoiceId}`}
        className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
      >
        <Download className="size-3.5" strokeWidth={1.75} />
      </button>
    ),
  },
];

export function BillingHistory() {
  return (
    <section className="rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Billing history
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Invoices and past subscription charges
        </p>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        rowKey={(row) => row.id}
        pageSize={5}
        emptyMessage="No invoices yet"
      />
    </section>
  );
}
